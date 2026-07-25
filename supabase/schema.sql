-- Bylaw — Supabase schema
-- Run this in the Supabase SQL editor (or `supabase db reset` with this file).
--
-- This MVP uses the anon key from the browser and stores wallet addresses as
-- plain text (there is no Supabase Auth session). RLS is enabled with permissive
-- policies so the demo works out of the box. Tighten these before any real use.

create table if not exists treasuries (
  id text primary key,
  name text not null,
  description text default '',
  treasury_wallet_address text default '',
  created_by_wallet text default '',
  created_at timestamptz not null default now()
);

create table if not exists bylaws (
  treasury_id text primary key references treasuries(id) on delete cascade,
  max_single_payout_sol numeric not null default 0,
  approval_threshold integer not null default 1,
  monthly_budget_sol numeric not null default 0,
  allowed_recipients jsonb not null default '[]'::jsonb,
  require_reason boolean not null default true,
  allow_non_members_to_request boolean not null default false
);

create table if not exists treasury_members (
  id text primary key,
  treasury_id text not null references treasuries(id) on delete cascade,
  wallet_address text not null,
  label text default '',
  role text not null default 'Viewer',
  added_at timestamptz not null default now()
);
create index if not exists idx_members_treasury on treasury_members(treasury_id);

create table if not exists payouts (
  id text primary key,
  treasury_id text not null references treasuries(id) on delete cascade,
  recipient text not null,
  amount_sol numeric not null,
  category text not null default 'Other',
  reason text default '',
  note text,
  requester text not null,
  status text not null default 'Pending Approval',
  policy_passed boolean not null default false,
  policy_reasons jsonb not null default '[]'::jsonb,
  rejection jsonb,
  tx_signature text,
  created_at timestamptz not null default now(),
  executed_at timestamptz
);
create index if not exists idx_payouts_treasury on payouts(treasury_id);

create table if not exists payout_approvals (
  id bigint generated always as identity primary key,
  treasury_id text not null references treasuries(id) on delete cascade,
  payout_id text not null references payouts(id) on delete cascade,
  signer_address text not null,
  signature text not null,
  message text not null,
  signed_at timestamptz not null default now()
);
create index if not exists idx_approvals_payout on payout_approvals(payout_id);

create table if not exists audit_events (
  id text primary key,
  treasury_id text not null references treasuries(id) on delete cascade,
  type text not null,
  actor text not null default 'system',
  detail text not null default '',
  meta jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_treasury on audit_events(treasury_id);

-- Row Level Security ---------------------------------------------------------
-- Enabled on every table. The policies below are intentionally permissive so
-- the anon-key demo works. Replace `using (true)` / `with check (true)` with
-- real, auth-scoped rules before production.

alter table treasuries enable row level security;
alter table bylaws enable row level security;
alter table treasury_members enable row level security;
alter table payouts enable row level security;
alter table payout_approvals enable row level security;
alter table audit_events enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'treasuries','bylaws','treasury_members','payouts','payout_approvals','audit_events'
  ]
  loop
    execute format('drop policy if exists %I_anon_all on %I;', t, t);
    execute format(
      'create policy %I_anon_all on %I for all to anon, authenticated using (true) with check (true);',
      t, t
    );
  end loop;
end $$;
