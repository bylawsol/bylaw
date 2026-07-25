-- ============================================================================
-- Bylaw — production schema (Phase 2 server data layer)
-- ============================================================================
-- Target: Supabase / PostgreSQL. Money is stored in LAMPORTS (bigint), never
-- floating point. RLS assumes the server mints a Supabase JWT after wallet
-- signature verification whose `sub` == users.id, so auth.uid() identifies the
-- authenticated user. Privileged mutations run server-side with the service
-- role (which bypasses RLS) AFTER application-level authorization checks.
--
-- NOTE: This migration defines the production target. The current client app
-- (localStorage / legacy schema.sql) does NOT yet talk to these tables — see
-- PRODUCTION.md for the cutover plan. This file has not been executed against a
-- live database in this environment.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── helper: current authenticated user id (from JWT sub) ────────────────────
create or replace function app_uid() returns uuid
language sql stable as $$ select auth.uid() $$;

-- ============================================================================
-- users
-- ============================================================================
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  wallet_address text unique not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_authenticated_at timestamptz
);
create index if not exists idx_users_wallet on users (wallet_address);

-- ============================================================================
-- auth_nonces (single-use, expiring wallet-auth challenges)
-- ============================================================================
create table if not exists auth_nonces (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  nonce_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_auth_nonces_wallet on auth_nonces (wallet_address);
create index if not exists idx_auth_nonces_expires on auth_nonces (expires_at);

-- ============================================================================
-- treasuries
-- ============================================================================
create table if not exists treasuries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  treasury_wallet_address text not null,
  network text not null check (network in ('devnet','testnet','mainnet-beta')),
  created_by uuid not null references users(id),
  public_page_enabled boolean not null default false,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_treasuries_created_by on treasuries (created_by);

-- ============================================================================
-- treasury_members
-- ============================================================================
create table if not exists treasury_members (
  id uuid primary key default gen_random_uuid(),
  treasury_id uuid not null references treasuries(id) on delete cascade,
  user_id uuid references users(id),
  wallet_address text not null,
  display_name text,
  role text not null check (role in ('owner','admin','approver','requester','viewer')),
  status text not null default 'active' check (status in ('invited','active','removed')),
  invited_by uuid references users(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (treasury_id, wallet_address)
);
create index if not exists idx_members_treasury on treasury_members (treasury_id);
create index if not exists idx_members_wallet on treasury_members (wallet_address);
create index if not exists idx_members_user on treasury_members (user_id);

-- ── authz helpers (defined after members table) ─────────────────────────────
create or replace function is_treasury_member(t_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from treasury_members m
    where m.treasury_id = t_id and m.user_id = app_uid() and m.status = 'active'
  )
$$;

create or replace function has_treasury_role(t_id uuid, roles text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from treasury_members m
    where m.treasury_id = t_id and m.user_id = app_uid()
      and m.status = 'active' and m.role = any(roles)
  )
$$;

-- ============================================================================
-- treasury_policies (versioned; amounts in lamports)
-- ============================================================================
create table if not exists treasury_policies (
  id uuid primary key default gen_random_uuid(),
  treasury_id uuid not null references treasuries(id) on delete cascade,
  version integer not null,
  max_single_payout_lamports bigint not null check (max_single_payout_lamports >= 0),
  monthly_budget_lamports bigint not null check (monthly_budget_lamports >= 0),
  approval_threshold integer not null check (approval_threshold >= 1),
  require_reason boolean not null,
  allow_non_member_requests boolean not null,
  recipient_allowlist_enabled boolean not null,
  created_by uuid references users(id),
  effective_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (treasury_id, version)
);
create index if not exists idx_policies_treasury on treasury_policies (treasury_id);

-- ============================================================================
-- policy_recipients (allowlist entries)
-- ============================================================================
create table if not exists policy_recipients (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references treasury_policies(id) on delete cascade,
  wallet_address text not null,
  label text,
  created_at timestamptz not null default now()
);
create index if not exists idx_policy_recipients_policy on policy_recipients (policy_id);

-- ============================================================================
-- payouts (amounts in lamports; policy snapshot captured at creation)
-- ============================================================================
create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  treasury_id uuid not null references treasuries(id) on delete cascade,
  requester_user_id uuid references users(id),
  requester_wallet_address text not null,
  recipient_wallet_address text not null,
  recipient_label text,
  amount_lamports bigint not null check (amount_lamports > 0),
  category text not null,
  reason text not null,
  reference_url text,
  policy_version integer not null,
  policy_result text not null check (policy_result in ('passed','blocked')),
  policy_snapshot jsonb not null,
  status text not null check (status in (
    'draft','pending_policy','policy_blocked','pending_approval','approved',
    'rejected','execution_pending','executed','execution_failed','cancelled'
  )),
  transaction_signature text unique,
  execution_network text,
  executed_by uuid references users(id),
  executed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_payouts_treasury on payouts (treasury_id);
create index if not exists idx_payouts_status on payouts (status);
create index if not exists idx_payouts_created_at on payouts (created_at desc);
create index if not exists idx_payouts_txsig on payouts (transaction_signature);

-- ============================================================================
-- payout_policy_checks (rule-by-rule result rows)
-- ============================================================================
create table if not exists payout_policy_checks (
  id uuid primary key default gen_random_uuid(),
  payout_id uuid not null references payouts(id) on delete cascade,
  rule_key text not null,
  passed boolean not null,
  message text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_checks_payout on payout_policy_checks (payout_id);

-- ============================================================================
-- payout_approvals (verified wallet signatures)
-- ============================================================================
create table if not exists payout_approvals (
  id uuid primary key default gen_random_uuid(),
  payout_id uuid not null references payouts(id) on delete cascade,
  approver_user_id uuid references users(id),
  approver_wallet_address text not null,
  signed_message text not null,
  signature text not null,
  message_hash text not null,
  approved_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_approvals_payout on payout_approvals (payout_id);
-- one active (non-revoked) approval per (payout, wallet)
create unique index if not exists uniq_active_approval
  on payout_approvals (payout_id, approver_wallet_address)
  where revoked_at is null;

-- ============================================================================
-- payout_rejections
-- ============================================================================
create table if not exists payout_rejections (
  id uuid primary key default gen_random_uuid(),
  payout_id uuid not null references payouts(id) on delete cascade,
  rejected_by uuid references users(id),
  rejector_wallet_address text not null,
  reason text not null,
  signature text,
  created_at timestamptz not null default now()
);
create index if not exists idx_rejections_payout on payout_rejections (payout_id);

-- ============================================================================
-- audit_events (append-only from application logic)
-- ============================================================================
create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  treasury_id uuid not null references treasuries(id) on delete cascade,
  payout_id uuid references payouts(id) on delete set null,
  actor_user_id uuid references users(id),
  actor_wallet_address text,
  event_type text not null,
  event_version integer not null default 1,
  event_data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_treasury_created on audit_events (treasury_id, created_at desc);
create index if not exists idx_audit_payout on audit_events (payout_id);

-- ============================================================================
-- public_receipts
-- ============================================================================
create table if not exists public_receipts (
  id uuid primary key default gen_random_uuid(),
  payout_id uuid unique not null references payouts(id) on delete cascade,
  public_id text unique not null,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_receipts_public_id on public_receipts (public_id);

-- ============================================================================
-- idempotency_keys (guard payout creation + execution)
-- ============================================================================
create table if not exists idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  operation text not null,
  idempotency_key text unique not null,
  result_reference text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists idx_idem_expires on idempotency_keys (expires_at);

-- ============================================================================
-- Row Level Security
-- Members access only treasuries they belong to. Privileged writes go through
-- the server (service role, bypasses RLS) after app-level authorization. These
-- policies are the defense-in-depth read layer + public receipt exposure.
-- ============================================================================
alter table users enable row level security;
alter table auth_nonces enable row level security;
alter table treasuries enable row level security;
alter table treasury_members enable row level security;
alter table treasury_policies enable row level security;
alter table policy_recipients enable row level security;
alter table payouts enable row level security;
alter table payout_policy_checks enable row level security;
alter table payout_approvals enable row level security;
alter table payout_rejections enable row level security;
alter table audit_events enable row level security;
alter table public_receipts enable row level security;
alter table idempotency_keys enable row level security;

-- users: a user can read/update only their own row.
create policy users_self_select on users for select using (id = app_uid());
create policy users_self_update on users for update using (id = app_uid()) with check (id = app_uid());

-- auth_nonces: no client access (server/service-role only).

-- treasuries: members read; public read only when public_page_enabled.
create policy treasuries_member_select on treasuries for select
  using (is_treasury_member(id) or public_page_enabled = true);

-- treasury_members: members of the treasury can read the roster.
create policy members_select on treasury_members for select
  using (is_treasury_member(treasury_id));

-- policies + recipients: members read.
create policy policies_select on treasury_policies for select
  using (is_treasury_member(treasury_id));
create policy policy_recipients_select on policy_recipients for select
  using (exists (select 1 from treasury_policies p
                 where p.id = policy_id and is_treasury_member(p.treasury_id)));

-- payouts: members read.
create policy payouts_member_select on payouts for select
  using (is_treasury_member(treasury_id));

-- policy checks / approvals / rejections: members read.
create policy checks_select on payout_policy_checks for select
  using (exists (select 1 from payouts p where p.id = payout_id and is_treasury_member(p.treasury_id)));
create policy approvals_select on payout_approvals for select
  using (exists (select 1 from payouts p where p.id = payout_id and is_treasury_member(p.treasury_id)));
create policy rejections_select on payout_rejections for select
  using (exists (select 1 from payouts p where p.id = payout_id and is_treasury_member(p.treasury_id)));

-- audit: members read. No update/delete policy exists => append-only for clients.
create policy audit_member_select on audit_events for select
  using (is_treasury_member(treasury_id));

-- public_receipts: anyone may read a PUBLISHED receipt; members read their own.
create policy receipts_public_select on public_receipts for select
  using (
    published = true
    or exists (select 1 from payouts p where p.id = payout_id and is_treasury_member(p.treasury_id))
  );

-- idempotency_keys: owner only (server also uses service role).
create policy idem_owner_select on idempotency_keys for select using (user_id = app_uid());

-- No INSERT/UPDATE/DELETE policies are granted to the anon/authenticated roles
-- on financial tables: all writes are performed server-side with the service
-- role after authorization. This prevents client-forged records.
