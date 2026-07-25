# Bylaw — Production Migration Status

**This application is NOT production‑ready.** It is a working Solana **testnet/devnet**
front end with a client‑side data layer. This document is the honest status of the
production hardening described in the migration spec, and the design for the
remaining work. Nothing here fabricates data, and no item below is marked "done"
unless it is actually implemented **and** verifiable in this repo.

Status legend: ✅ implemented & verified · 🟡 partial · 📐 designed (not built) ·
⛔ blocked on external infrastructure · 🔒 requires security audit.

---

## 1. Architecture found

- **Next.js 14.2.7 App Router + TypeScript + Tailwind.** Wallet adapter (Phantom),
  `@solana/web3.js`, `@supabase/supabase-js` (optional), Zod, Recharts.
- **100% client‑side.** No API routes, no server actions before this change.
  `components/treasury-provider.tsx` (a React context) holds all state and performs
  every mutation in the browser.
- **Data layer:** `lib/storage.ts` persists to **browser localStorage** by default,
  or — if `NEXT_PUBLIC_SUPABASE_*` are set — writes **directly from the browser**
  with the anon key against `supabase/schema.sql`, whose RLS is fully permissive
  (`using(true)`). So even "Supabase mode" is client‑trusted and **not secure**.
- **Policy engine** `lib/policy.ts` is a pure function (good — reusable server‑side).
- **Execution** `lib/solana.ts` = client wallet transfer; **approvals** = client
  `signMessage`. No server verification of either.
- Amounts are stored as **floating‑point SOL** (not lamports).

**Implication:** the spec's core (server‑side data + auth + RLS + verified
execution) is a rebuild of the entire data/mutation layer. It cannot be built or
verified in this environment without a provisioned Supabase project, an RPC
provider, and session secrets.

## 2. Demo behavior removed ✅

Demo mode was removed in the previous commit and re‑verified here. Repo‑wide sweep
for `demo|mock|fixture|fake|seed|sample|Bylaw Foundation|Founder Wallet|Ops Wallet`
returns **no state‑driving occurrences**. Remaining hits are: the honesty section
copy "No fake autonomy." (a truthful claim), a one‑word code comment ("No auto‑seed"),
and an input placeholder (now "e.g. Acme DAO Treasury"). The app starts from a
legitimate empty state: first visit → `/app` → `/app/setup` wizard; no auto‑created
treasury, no sample payouts, no fabricated tx/approvals/audit.

## 3. Files changed this turn

- `next.config.mjs` — baseline security headers (§18, partial). ✅
- `lib/env.ts` — Zod env schema + `assertProductionEnv()`. ✅
- `app/api/health/route.ts` — `/api/health` (app + RPC + DB checks). ✅
- `.env.example` — full production variable set. ✅
- `supabase/migrations/0001_init_production.sql` — production schema + RLS. 📐 (unrun)
- `app/app/setup/page.tsx` — placeholder text.
- `PRODUCTION.md` — this document.

## 4. Database migrations 📐 (ready to apply, not executed)

`supabase/migrations/0001_init_production.sql` implements the full spec schema:
`users, auth_nonces, treasuries, treasury_members, treasury_policies,
policy_recipients, payouts, payout_policy_checks, payout_approvals,
payout_rejections, audit_events, public_receipts, idempotency_keys`.
Money is `bigint` **lamports** (no floats). All required indexes, unique
constraints (incl. one active approval per payout+wallet), status CHECKs, and an
append‑only audit design are included. **It has not been run** against a database
in this environment (no Supabase project). The legacy `supabase/schema.sql`
remains only to document the current insecure client mode — do not use it in prod.

## 5. RLS policies 📐

Defined in the migration. Model: the server mints a Supabase JWT after wallet
signature verification with `sub = users.id`, so `auth.uid()` identifies the user.
Helpers `is_treasury_member()` / `has_treasury_role()` gate reads to members.
**All financial writes are server‑only (service role, after app authz)** — no
anon/authenticated INSERT/UPDATE/DELETE policies on financial tables, which
prevents client‑forged records. Public receipts are readable when `published`.
Not yet enforced live (no DB).

## 6. Authentication flow 📐 (designed, not built)

Wallet‑nonce session auth (spec §4):
1. Client connects wallet → `POST /api/auth/nonce {wallet}` → server stores a hashed,
   expiring, single‑use nonce in `auth_nonces`, returns the nonce.
2. Client signs a canonical **authentication** message (app name, wallet, nonce,
   issued/expires, domain, network, purpose: *"Sign to authenticate with Bylaw.
   This does not authorize a transaction or transfer funds."*).
3. `POST /api/auth/verify {wallet, signature}` → server verifies ed25519 signature,
   consumes the nonce (replay‑proof), upserts `users`, sets a **HTTP‑only,
   Secure, SameSite** session cookie (signed with `SESSION_SECRET`).
4. `POST /api/auth/logout` clears it; wallet change invalidates the session.
Not built (needs `SESSION_SECRET`, `AUTH_NONCE_SECRET`, DB). Distinct from approval
signatures.

## 7. Authorization matrix 📐

| Action | owner | admin | approver | requester | viewer | public |
|---|---|---|---|---|---|---|
| View treasury | ✓ | ✓ | ✓ | ✓ | ✓ | only if public page enabled |
| Edit treasury / policy | ✓ | ✓ | — | — | — | — |
| Add/remove members | ✓ | ✓ | — | — | — | — |
| Create payout | ✓ | ✓ | ✓ | ✓ | — | — |
| Approve / reject | ✓ | ✓ | ✓ | — | — | — |
| Execute payout | ✓ | ✓ | — | — | — | — |
| View published receipt | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

Enforced by DB RLS **and** server helpers (`requireTreasuryRole`, `canApprovePayout`,
`canExecutePayout`, …). Client roles are never trusted. Helpers designed, not built.

## 8. Payout state machine 📐

`draft → pending_policy → {policy_blocked | pending_approval} →
{approved | rejected} → execution_pending → {executed | execution_failed}`.
`execution_failed → approved` (retry, if permitted); `pending_approval → cancelled`
(if authorized); `policy_blocked → draft` (edit/resubmit). Server validates every
transition; arbitrary status assignment is rejected. To be implemented as an
explicit server state‑machine guard.

## 9. Approval‑signature format 📐

Canonical approve message includes: app name · action `approve_payout` · payout id ·
treasury id + slug · amount (lamports + formatted SOL) · recipient · policy version ·
unique approval challenge/nonce · network · issued‑at · expires‑at. Server returns
the exact string; wallet signs it; server verifies signature, that the signer ==
authenticated user == active eligible member, that the payout is still approvable,
stores `signed_message`+`signature`+`message_hash`, writes an audit event, and
recomputes threshold from active, non‑revoked approvals — all in one transaction.

## 10. Execution‑verification flow 📐

No simulated execution exists. A payout becomes `executed` **only after the server
confirms a real Solana transaction**: server creates an execution intent (idempotency
key) → re‑checks authz/policy/threshold → wallet signs+sends → client posts the
signature → **server queries Solana RPC** and verifies commitment (`confirmed`/
`finalized`), sender, recipient, exact lamports, network, and success → transactional
`executed` + audit + receipt. Double‑execution prevented by idempotency + unique
`transaction_signature` + conditional status update. Server‑side execution not built
(needs `SOLANA_RPC_URL` + DB); the current client transfer path remains for
testnet/devnet use.

## 11. Environment variables

See `.env.example`. Public: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SOLANA_NETWORK`
(devnet default), `NEXT_PUBLIC_SOLANA_EXPLORER_CLUSTER`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. Server‑only (never `NEXT_PUBLIC_`):
`SUPABASE_SERVICE_ROLE_KEY`, `SOLANA_RPC_URL`, `SOLANA_RPC_FALLBACK_URL`,
`SOLANA_COMMITMENT`, `SESSION_SECRET`, `AUTH_NONCE_SECRET`, `SENTRY_DSN`. Validated
by `lib/env.ts`; `assertProductionEnv()` fails fast once the server layer exists.

## 12–15. Setup / Supabase / Devnet / Deploy

- **Local:** `npm install` → `cp .env.example .env.local` → `npm run dev`. Runs in
  Local mode (browser storage) with no secrets. Devnet is the safe default.
- **Supabase (Phase 2):** create a project; run `supabase/migrations/0001_init_production.sql`
  in the SQL editor; set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  and server `SUPABASE_SERVICE_ROLE_KEY`. (The server data layer must be built before
  this replaces localStorage — see §16.)
- **Devnet test:** set `NEXT_PUBLIC_SOLANA_NETWORK=devnet`, fund the connected wallet
  from a devnet faucet, exercise create → policy → approve → execute; verify the tx on
  the devnet Explorer.
- **Deploy:** Vercel → import `bylawsol/bylaw` → set env vars → deploy. `/api/health`
  reports app/RPC/DB status.

## 16. Testing results

- ✅ `next build` compiles clean (no TS errors). `/api/health` returns JSON.
- ⛔ Unit/integration/E2E tests (§22): **not added** — the meaningful ones
  (policy engine already testable; auth, RLS, execution) depend on the server layer
  and a DB. The policy engine is pure and ready for unit tests today; that is the
  recommended first test target.

## 17. Security limitations (current build)

- 🔒 Data + all mutations are **client‑trusted**; roles are enforced only in the UI.
- 🔒 "Supabase mode" uses **permissive RLS** — do not deploy it as‑is.
- 🔒 Approvals/execution are **not server‑verified**; a determined user could craft
  local records. (Executions are still real on‑chain transfers, but not gated.)
- 🟡 Security headers added; **no CSP yet** (must be authored + tested with real
  wallet/RPC flows — a wrong CSP breaks wallet connect).
- ⛔ No rate limiting, no server sessions, no idempotency enforcement yet.

## 18. Mainnet‑readiness blockers

Do **not** enable `mainnet-beta` until all of: server data layer + RLS live · wallet
session auth · server‑verified approvals · server‑verified execution with idempotency ·
rate limiting · CSP · monitoring · and an **independent security review**. Bylaw is
**not a multisig** (no on‑chain custody/threshold) and must not be described as one.

## 19. Requires external audit / infrastructure

Supabase project + service‑role key · production RPC provider (`SOLANA_RPC_URL`) ·
`SESSION_SECRET`/`AUTH_NONCE_SECRET` · Sentry DSN (optional) · **third‑party security
audit** before any mainnet or custody claim.

## 20. Manual QA checklist

- [ ] First visit routes to `/app/setup` (no auto data).
- [ ] Create treasury → dashboard shows real zeros + empty states.
- [ ] No "demo/sample/Bylaw Foundation" strings anywhere.
- [ ] Network badge matches `NEXT_PUBLIC_SOLANA_NETWORK`; Explorer links use that cluster.
- [ ] Approve requires a connected wallet signature; duplicate approval blocked.
- [ ] Execute performs a real cluster transfer; receipt links to the real Explorer tx.
- [ ] `/api/health` returns `status: ok`.
- [ ] Response includes `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.

---

### Bottom line

Implemented & verified this turn: demo‑free empty‑state app, security headers, env
validation, `/api/health`, and a complete **ready‑to‑apply** production schema + RLS.
Everything server‑side (auth, data cutover, verified approvals/execution, tests,
rate limiting) is **designed here but not built**, and is blocked on provisioning
Supabase + RPC + secrets. This is the next phase — not a claim of completion.
