# Bylaw

**Policy-bound payouts for onchain teams.**

Bylaw is a minimal treasury approval and payout platform for crypto teams. Define
simple treasury spending rules, submit payout requests, collect wallet-signed
approvals, execute Solana **devnet** payments, and keep a clean audit log.

This is a **Solana Devnet MVP**. It is not a multisig and does not custody funds.
Execution is a direct SOL transfer from the connected wallet on devnet.

---

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn-style UI components + Lucide icons
- Solana wallet adapter (Phantom) + `@solana/web3.js`
- Supabase (optional) with a localStorage fallback ("Local Demo" mode)
- Zod for validation, Recharts for the dashboard chart

---

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

Production build:

```bash
npm run build && npm start
```

The app runs with **no configuration**. With no Supabase env vars set, it starts
in **Local Demo** mode and seeds a sample `Bylaw Foundation` treasury in your
browser's localStorage.

---

## Environment variables

Copy `.env.local.example` to `.env.local`. All are optional.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. Omit for Local Demo mode. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key. Omit for Local Demo mode. |
| `NEXT_PUBLIC_SOLANA_NETWORK` | `devnet` (only devnet execution is supported). |

If **both** Supabase vars are present, the app switches to Supabase persistence
automatically and the top bar shows a **Supabase** badge instead of **Local Demo**.

---

## Supabase setup (optional)

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql).
   It creates `treasuries`, `bylaws`, `treasury_members`, `payouts`,
   `payout_approvals`, and `audit_events`, and enables RLS with permissive
   demo policies.
3. In **Project Settings → API**, copy the Project URL and the `anon` public key
   into `.env.local`.
4. Restart `npm run dev`. The badge should read **Supabase**.

> The demo policies are `using (true)` because the browser uses the anon key with
> no Supabase Auth session. Tighten them before any real-world use.

---

## Using the app

1. **Open App** → you land on the dashboard with the seeded treasury.
2. **Connect Wallet** (Phantom) → your wallet is added as the first **Admin**.
3. **Bylaws** → set limits, approval threshold, monthly budget, recipient
   allowlist, and requirement toggles. Every save writes an audit event.
4. **Members** → add wallets with an `Admin` / `Approver` / `Viewer` role.
5. **Payouts** → create a request. The policy engine runs live and on submit:
   - Passing requests become **Pending Approval**.
   - Failing requests are saved as **Policy Blocked** with the exact reasons.
6. **Approve** → an Approver/Admin signs a structured message with their wallet
   (`signMessage`). Duplicate approvals from the same wallet are blocked.
7. **Execute** → once approvals ≥ threshold and you're an Admin, execute a real
   devnet SOL transfer. The tx signature is recorded and linked to Solana Explorer.
   Fund the connected wallet from a [devnet faucet](https://faucet.solana.com) first.
8. **Audit** → the full chronological log, filterable by type, exportable as JSON.

---

## Testing checklist

- [ ] Landing page loads; nav anchors (How it works / Product / Pricing / FAQ) scroll.
- [ ] `Open App` reaches `/app` and seeds the `Bylaw Foundation` treasury.
- [ ] Top bar shows **Solana Devnet** + **Local Demo** (or **Supabase**) badges.
- [ ] Connect Phantom → wallet appears shortened; you're added as Admin (Members).
- [ ] Bylaws: edit values, Save (validation blocks bad input), Reset to defaults.
- [ ] Payouts: live policy preview updates as you type.
- [ ] Create a payout under the limit → **Pending Approval**.
- [ ] Create a payout over `maxSinglePayoutSol` → **Policy Blocked** with reason.
- [ ] Approve with a connected Approver/Admin wallet → signature stored, count ++.
- [ ] Approving twice from the same wallet is prevented.
- [ ] Reject with a reason → status **Rejected**.
- [ ] Fund the wallet on devnet, Execute → tx signature + Explorer link recorded.
- [ ] Dashboard stats and monthly chart reflect the executed payout.
- [ ] Audit page lists all events; filter + Export JSON work.
- [ ] Settings: rename, export/import JSON, reseed, clear local data.
- [ ] Resize to mobile → sidebar becomes a drawer; layouts stack.
- [ ] No console errors; no hydration warnings.

---

## Limitations (honest)

- **Not a multisig.** V1 is a policy + approval layer. Approvals are wallet
  signatures over a message; they are not on-chain multisig authorizations.
  Execution is a single-signer transfer from the connected Admin wallet.
- **Devnet only.** No mainnet path is wired up.
- **Approval signatures** are verified as "this wallet signed", not re-verified
  cryptographically against the message on execution (a natural next step).
- **Supabase RLS** is permissive for the anon-key demo. Not production-hardened.
- **No AI, no yield, no autonomous agents.** By design.
