// Core domain model for Bylaw. Shared by both storage backends and the UI.

export type MemberRole = "Admin" | "Approver" | "Viewer";

export type PayoutCategory =
  | "Contributor"
  | "Grant"
  | "Marketing"
  | "Operations"
  | "Emergency"
  | "Other";

export const PAYOUT_CATEGORIES: PayoutCategory[] = [
  "Contributor",
  "Grant",
  "Marketing",
  "Operations",
  "Emergency",
  "Other",
];

export const MEMBER_ROLES: MemberRole[] = ["Admin", "Approver", "Viewer"];

export type TreasuryType =
  | "DAO"
  | "Launchpad"
  | "Memecoin"
  | "NFT Community"
  | "Grant Team"
  | "Startup"
  | "Other";

export const TREASURY_TYPES: TreasuryType[] = [
  "DAO",
  "Launchpad",
  "Memecoin",
  "NFT Community",
  "Grant Team",
  "Startup",
  "Other",
];

export type PayoutStatus =
  | "Pending Approval"
  | "Policy Blocked"
  | "Rejected"
  | "Executed";

export type AuditEventType =
  | "treasury_created"
  | "bylaws_updated"
  | "member_added"
  | "member_removed"
  | "payout_created"
  | "payout_policy_passed"
  | "payout_policy_blocked"
  | "payout_approved"
  | "payout_rejected"
  | "payout_executed";

export interface Bylaws {
  maxSinglePayoutSol: number;
  approvalThreshold: number;
  monthlyBudgetSol: number;
  allowedRecipients: string[];
  requireReason: boolean;
  allowNonMembersToRequest: boolean;
}

export interface Member {
  id: string;
  walletAddress: string;
  label: string;
  role: MemberRole;
  addedAt: string;
}

export interface Approval {
  signerAddress: string;
  signature: string; // base58 signature of the approval message
  message: string;
  signedAt: string;
}

export interface Payout {
  id: string;
  recipient: string;
  amountSol: number;
  category: PayoutCategory;
  reason: string;
  note?: string;
  requester: string;
  status: PayoutStatus;
  policyPassed: boolean;
  policyReasons: string[]; // human-readable pass/fail reasons
  approvals: Approval[];
  rejection?: {
    rejectedBy: string;
    reason: string;
    rejectedAt: string;
  };
  txSignature?: string;
  createdAt: string;
  executedAt?: string;
  demo?: boolean; // true for sample payouts executed in demo mode (never a real tx)
}

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  actor: string; // wallet address or "system"
  detail: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface Treasury {
  id: string;
  name: string;
  description: string;
  treasuryType?: TreasuryType;
  isDemo?: boolean;
  treasuryWalletAddress: string;
  createdByWallet: string;
  createdAt: string;
  bylaws: Bylaws;
  members: Member[];
  payouts: Payout[];
  auditEvents: AuditEvent[];
}

export const DEFAULT_BYLAWS: Bylaws = {
  maxSinglePayoutSol: 2,
  approvalThreshold: 2,
  monthlyBudgetSol: 10,
  allowedRecipients: [],
  requireReason: true,
  allowNonMembersToRequest: false,
};
