import { AuditEvent, Payout, Treasury } from "./types";
import { uid } from "./utils";
import { NETWORK_LABEL_LOWER } from "./network";

// A deterministic recipient for the sample payout.
const SAMPLE_RECIPIENT = "8pM1DDwZLsvUgdhV8fjKR1Wd6qPkt5o4mR7kd6qGh1oT";

/**
 * Build the seed "Bylaw Foundation" treasury for demo mode.
 * The connected wallet (if any) becomes the first Admin. No fake executed
 * transactions are ever seeded — only a single pending payout.
 */
export function buildSeedTreasury(connectedWallet: string | null): Treasury {
  const now = new Date();
  const createdAt = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString();
  const admin = connectedWallet || "";

  const treasuryId = uid("tr_");

  const auditEvents: AuditEvent[] = [
    {
      id: uid("ev_"),
      type: "treasury_created",
      actor: admin || "system",
      detail: "Treasury “Bylaw Foundation” created",
      createdAt,
    },
    {
      id: uid("ev_"),
      type: "bylaws_updated",
      actor: admin || "system",
      detail: "Initial bylaws set",
      createdAt,
    },
  ];

  const samplePayout: Payout = {
    id: uid("po_"),
    recipient: SAMPLE_RECIPIENT,
    amountSol: 0.5,
    category: "Contributor",
    reason: "Weekly contributor payout for docs and design work",
    requester: admin || SAMPLE_RECIPIENT,
    status: "Pending Approval",
    policyPassed: true,
    policyReasons: [
      "PASS — Amount is positive: Requesting 0.5 SOL",
      "PASS — Within single-payout limit: 0.5 SOL vs limit of 2 SOL",
      "PASS — Recipient allowlist: No allowlist configured — any recipient allowed",
      "PASS — Reason provided: Reason provided",
      "PASS — Within monthly budget: 0 executed + 0.5 requested vs 10 SOL monthly budget",
      "PASS — Requester authorized: Requester is a treasury member",
    ],
    approvals: [],
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 5).toISOString(),
  };

  auditEvents.push({
    id: uid("ev_"),
    type: "payout_created",
    actor: samplePayout.requester,
    detail: "Payout created: 0.5 SOL to contributor",
    meta: { payoutId: samplePayout.id },
    createdAt: samplePayout.createdAt,
  });
  auditEvents.push({
    id: uid("ev_"),
    type: "payout_policy_passed",
    actor: "system",
    detail: "Policy check passed for 0.5 SOL payout",
    meta: { payoutId: samplePayout.id },
    createdAt: samplePayout.createdAt,
  });

  return {
    id: treasuryId,
    name: "Bylaw Foundation",
    description: `Sample ${NETWORK_LABEL_LOWER} treasury. Define bylaws, submit payouts, collect wallet-signed approvals, and execute on Solana ${NETWORK_LABEL_LOWER}.`,
    treasuryWalletAddress: admin || SAMPLE_RECIPIENT,
    createdByWallet: admin || "system",
    createdAt,
    bylaws: {
      maxSinglePayoutSol: 2,
      approvalThreshold: 2,
      monthlyBudgetSol: 10,
      allowedRecipients: [],
      requireReason: true,
      allowNonMembersToRequest: false,
    },
    members: admin
      ? [
          {
            id: uid("mb_"),
            walletAddress: admin,
            label: "You (creator)",
            role: "Admin",
            addedAt: createdAt,
          },
        ]
      : [],
    payouts: [samplePayout],
    auditEvents,
  };
}
