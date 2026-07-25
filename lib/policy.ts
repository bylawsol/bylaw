import { Bylaws, Payout, Treasury } from "./types";
import { currentMonthKey, formatSol, monthKey } from "./utils";

export interface PolicyCheck {
  label: string;
  passed: boolean;
  detail: string;
}

export interface PolicyResult {
  passed: boolean;
  checks: PolicyCheck[];
  reasons: string[]; // flat list of human-readable reasons (pass + fail)
}

export interface PolicyInput {
  recipient: string;
  amountSol: number;
  reason: string;
  requester: string;
}

/** Total SOL executed within a calendar month (defaults to the current one). */
export function executedThisMonth(treasury: Treasury, asOf?: Date): number {
  const key = asOf ? monthKey(asOf) : currentMonthKey();
  return treasury.payouts
    .filter(
      (p) =>
        p.status === "Executed" &&
        p.executedAt &&
        monthKey(p.executedAt) === key,
    )
    .reduce((sum, p) => sum + p.amountSol, 0);
}

function isMember(treasury: Treasury, wallet: string): boolean {
  return treasury.members.some(
    (m) => m.walletAddress.toLowerCase() === wallet.toLowerCase(),
  );
}

/**
 * The policy engine. Pure function — given a treasury and a proposed payout,
 * returns every check with pass/fail and human-readable detail.
 */
export function evaluatePolicy(
  treasury: Treasury,
  input: PolicyInput,
  asOf?: Date,
): PolicyResult {
  const b: Bylaws = treasury.bylaws;
  const checks: PolicyCheck[] = [];

  // 1. Amount must be > 0
  checks.push({
    label: "Amount is positive",
    passed: input.amountSol > 0,
    detail:
      input.amountSol > 0
        ? `Requesting ${formatSol(input.amountSol)} SOL`
        : "Amount must be greater than 0 SOL",
  });

  // 2. Amount <= maxSinglePayoutSol
  checks.push({
    label: "Within single-payout limit",
    passed: input.amountSol <= b.maxSinglePayoutSol,
    detail: `${formatSol(input.amountSol)} SOL vs limit of ${formatSol(
      b.maxSinglePayoutSol,
    )} SOL`,
  });

  // 3. Recipient allowlist (only enforced if allowlist is non-empty)
  const allowlistActive = b.allowedRecipients.length > 0;
  const recipientAllowed =
    !allowlistActive ||
    b.allowedRecipients.some(
      (r) => r.toLowerCase() === input.recipient.toLowerCase(),
    );
  checks.push({
    label: allowlistActive ? "Recipient is allowlisted" : "Recipient allowlist",
    passed: recipientAllowed,
    detail: allowlistActive
      ? recipientAllowed
        ? "Recipient is on the allowlist"
        : "Recipient is not on the allowlist"
      : "No allowlist configured — any recipient allowed",
  });

  // 4. Reason required
  const reasonOk = !b.requireReason || input.reason.trim().length > 0;
  checks.push({
    label: "Reason provided",
    passed: reasonOk,
    detail: b.requireReason
      ? reasonOk
        ? "Reason provided"
        : "A reason is required by this treasury"
      : "Reason not required by policy",
  });

  // 5. Monthly budget not exceeded by executed payouts + this one
  const spent = executedThisMonth(treasury, asOf);
  const withinBudget = spent + input.amountSol <= b.monthlyBudgetSol;
  checks.push({
    label: "Within monthly budget",
    passed: withinBudget,
    detail: `${formatSol(spent)} executed + ${formatSol(
      input.amountSol,
    )} requested vs ${formatSol(b.monthlyBudgetSol)} SOL monthly budget`,
  });

  // 6. Requester must be a member unless allowNonMembersToRequest
  const requesterOk = b.allowNonMembersToRequest || isMember(treasury, input.requester);
  checks.push({
    label: "Requester authorized",
    passed: requesterOk,
    detail: b.allowNonMembersToRequest
      ? "Non-members are allowed to request"
      : requesterOk
        ? "Requester is a treasury member"
        : "Only treasury members may submit requests",
  });

  const passed = checks.every((c) => c.passed);
  const reasons = checks.map(
    (c) => `${c.passed ? "PASS" : "FAIL"} — ${c.label}: ${c.detail}`,
  );

  return { passed, checks, reasons };
}

export interface ExecEligibility {
  canExecute: boolean;
  reasons: string[];
}

/**
 * Whether a payout can be executed by the given connected wallet.
 * Enforces: policy passed, threshold met, not rejected, not executed, wallet is Admin.
 */
export function canExecutePayout(
  treasury: Treasury,
  payout: Payout,
  connectedWallet: string | null,
): ExecEligibility {
  const reasons: string[] = [];

  if (!payout.policyPassed) reasons.push("Policy did not pass");
  if (payout.status === "Rejected") reasons.push("Payout was rejected");
  if (payout.status === "Executed") reasons.push("Payout already executed");
  if (payout.approvals.length < treasury.bylaws.approvalThreshold) {
    reasons.push(
      `Needs ${treasury.bylaws.approvalThreshold} approvals (${payout.approvals.length} collected)`,
    );
  }

  const isAdmin =
    connectedWallet != null &&
    treasury.members.some(
      (m) =>
        m.walletAddress.toLowerCase() === connectedWallet.toLowerCase() &&
        m.role === "Admin",
    );
  if (!connectedWallet) reasons.push("Connect a wallet to execute");
  else if (!isAdmin) reasons.push("Only an Admin can execute");

  return { canExecute: reasons.length === 0, reasons };
}

export function memberRole(
  treasury: Treasury,
  wallet: string | null,
): "Admin" | "Approver" | "Viewer" | null {
  if (!wallet) return null;
  const m = treasury.members.find(
    (mem) => mem.walletAddress.toLowerCase() === wallet.toLowerCase(),
  );
  return m?.role ?? null;
}

export function canApprove(treasury: Treasury, wallet: string | null): boolean {
  const role = memberRole(treasury, wallet);
  return role === "Admin" || role === "Approver";
}
