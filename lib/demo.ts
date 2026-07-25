import { Approval, AuditEvent, Payout, Treasury } from "./types";
import { uid } from "./utils";

// Valid devnet-format addresses used only for the sample demo treasury.
const FOUNDER = "36Y9zUDMx2JuK9DmZn9ibKh6ZCcMEtsGpXcVXW7Dbbuq";
const OPS = "68SyADuFWerx5JKnGSk6HaeZh5UxaLhkv3zaVNaxC4nD";
const GRANTS = "4Yw3hDUupbHPNm5A81zsaK2cR7AVKVSRVvRN28otEUWS";
const RECIPIENT = "8pM1DDwZLsvUgdhV8fjKR1Wd6qPkt5o4mR7kd6qGh1oT";

const DAY = 1000 * 60 * 60 * 24;
const HOUR = 1000 * 60 * 60;

function demoApproval(signer: string, minsAgo: number): Approval {
  return {
    signerAddress: signer,
    signature: `DEMO-${uid()}`,
    message: "Demo approval — no wallet signature performed.",
    signedAt: new Date(Date.now() - minsAgo * 60 * 1000).toISOString(),
  };
}

/**
 * The "Bylaw Foundation" sample treasury for demo mode. Everything here is
 * clearly demo — the executed payout carries a DEMO tx marker and never links
 * to a real explorer transaction.
 */
export function buildDemoTreasury(): Treasury {
  const now = Date.now();
  const createdAt = new Date(now - 5 * DAY).toISOString();
  const id = uid("tr_");

  const members = [
    { id: uid("mb_"), walletAddress: FOUNDER, label: "Founder Wallet", role: "Admin" as const, addedAt: createdAt },
    { id: uid("mb_"), walletAddress: OPS, label: "Ops Wallet", role: "Approver" as const, addedAt: createdAt },
    { id: uid("mb_"), walletAddress: GRANTS, label: "Grants Wallet", role: "Approver" as const, addedAt: createdAt },
  ];

  // 1 — Contributor payout, pending approval, policy passed.
  const p1: Payout = {
    id: uid("po_"),
    recipient: RECIPIENT,
    amountSol: 0.5,
    category: "Contributor",
    reason: "Weekly contributor payout for docs and design work",
    requester: FOUNDER,
    status: "Pending Approval",
    policyPassed: true,
    policyReasons: [
      "PASS — Amount is positive: Requesting 0.5 SOL",
      "PASS — Within single-payout limit: 0.5 SOL vs limit of 2 SOL",
      "PASS — Recipient allowlist: No allowlist configured — any recipient allowed",
      "PASS — Reason provided: Reason provided",
      "PASS — Within monthly budget: 1 executed + 0.5 requested vs 10 SOL monthly budget",
      "PASS — Requester authorized: Requester is a treasury member",
    ],
    approvals: [demoApproval(FOUNDER, 90)],
    createdAt: new Date(now - 6 * HOUR).toISOString(),
    demo: true,
  };

  // 2 — Marketing budget, policy blocked (exceeds max single payout).
  const p2: Payout = {
    id: uid("po_"),
    recipient: RECIPIENT,
    amountSol: 3,
    category: "Marketing",
    reason: "Quarterly marketing campaign budget",
    requester: OPS,
    status: "Policy Blocked",
    policyPassed: false,
    policyReasons: [
      "PASS — Amount is positive: Requesting 3 SOL",
      "FAIL — Within single-payout limit: 3 SOL vs limit of 2 SOL",
      "PASS — Recipient allowlist: No allowlist configured — any recipient allowed",
      "PASS — Reason provided: Reason provided",
      "PASS — Within monthly budget: 1 executed + 3 requested vs 10 SOL monthly budget",
      "PASS — Requester authorized: Requester is a treasury member",
    ],
    approvals: [],
    createdAt: new Date(now - 2 * DAY).toISOString(),
    demo: true,
  };

  // 3 — Grant payout, executed in demo (fake tx, clearly marked).
  const executedAt = new Date(now - 1 * DAY).toISOString();
  const p3: Payout = {
    id: uid("po_"),
    recipient: GRANTS,
    amountSol: 1,
    category: "Grant",
    reason: "Ecosystem grant milestone 1 payout",
    requester: FOUNDER,
    status: "Executed",
    policyPassed: true,
    policyReasons: [
      "PASS — Amount is positive: Requesting 1 SOL",
      "PASS — Within single-payout limit: 1 SOL vs limit of 2 SOL",
      "PASS — Recipient allowlist: No allowlist configured — any recipient allowed",
      "PASS — Reason provided: Reason provided",
      "PASS — Within monthly budget: 0 executed + 1 requested vs 10 SOL monthly budget",
      "PASS — Requester authorized: Requester is a treasury member",
    ],
    approvals: [demoApproval(FOUNDER, 200), demoApproval(OPS, 190)],
    txSignature: `DEMO-${uid()}${uid()}`,
    executedAt,
    createdAt: new Date(now - 2 * DAY).toISOString(),
    demo: true,
  };

  const ev = (
    type: AuditEvent["type"],
    actor: string,
    detail: string,
    at: string,
    meta?: Record<string, unknown>,
  ): AuditEvent => ({ id: uid("ev_"), type, actor, detail, meta, createdAt: at });

  const auditEvents: AuditEvent[] = [
    ev("treasury_created", FOUNDER, "Treasury “Bylaw Foundation” created", createdAt),
    ev("member_added", FOUNDER, "Member added: Founder Wallet (Admin)", createdAt),
    ev("member_added", FOUNDER, "Member added: Ops Wallet (Approver)", createdAt),
    ev("member_added", FOUNDER, "Member added: Grants Wallet (Approver)", createdAt),
    ev("bylaws_updated", FOUNDER, "Initial bylaws set", createdAt),
    ev("payout_created", FOUNDER, "Payout created: 1 SOL (Grant)", p3.createdAt, { payoutId: p3.id }),
    ev("payout_policy_passed", "system", "Policy passed for 1 SOL payout", p3.createdAt, { payoutId: p3.id }),
    ev("payout_approved", FOUNDER, "Payout approved (demo signature) by Founder Wallet", executedAt, { payoutId: p3.id }),
    ev("payout_approved", OPS, "Payout approved (demo signature) by Ops Wallet", executedAt, { payoutId: p3.id }),
    ev("payout_executed", FOUNDER, "Payout executed: 1 SOL (demo — no real transaction)", executedAt, { payoutId: p3.id, demo: true }),
    ev("payout_created", OPS, "Payout created: 3 SOL (Marketing)", p2.createdAt, { payoutId: p2.id }),
    ev("payout_policy_blocked", "system", "Policy blocked: Within single-payout limit", p2.createdAt, { payoutId: p2.id }),
    ev("payout_created", FOUNDER, "Payout created: 0.5 SOL (Contributor)", p1.createdAt, { payoutId: p1.id }),
    ev("payout_policy_passed", "system", "Policy passed for 0.5 SOL payout", p1.createdAt, { payoutId: p1.id }),
  ];

  return {
    id,
    name: "Bylaw Foundation",
    description:
      "Sample treasury for exploring the full Bylaw workflow. No wallet needed — nothing here touches a real chain.",
    treasuryType: "DAO",
    isDemo: true,
    treasuryWalletAddress: FOUNDER,
    createdByWallet: FOUNDER,
    createdAt,
    bylaws: {
      maxSinglePayoutSol: 2,
      monthlyBudgetSol: 10,
      approvalThreshold: 2,
      allowedRecipients: [],
      requireReason: true,
      allowNonMembersToRequest: false,
    },
    members,
    payouts: [p1, p2, p3],
    auditEvents,
  };
}

/** The order approvals should be added in when clicking Approve in demo mode. */
export const DEMO_SIGNER_ORDER = [FOUNDER, OPS, GRANTS];
