import { Bylaws } from "./types";

export type TemplateRisk = "Strict" | "Balanced" | "Loose";

export interface RuleTemplate {
  id: string;
  name: string;
  risk: TemplateRisk;
  description: string;
  // The rule fields a template sets. Recipient allowlist is left untouched.
  rules: Omit<Bylaws, "allowedRecipients">;
}

export const RULE_TEMPLATES: RuleTemplate[] = [
  {
    id: "conservative-dao",
    name: "Conservative DAO",
    risk: "Strict",
    description: "Small payouts, tight budget, 3 approvals. Hard to move funds fast.",
    rules: {
      maxSinglePayoutSol: 1,
      monthlyBudgetSol: 5,
      approvalThreshold: 3,
      requireReason: true,
      allowNonMembersToRequest: false,
    },
  },
  {
    id: "small-team",
    name: "Small Team",
    risk: "Balanced",
    description: "Sensible defaults for a small crypto team. 2-of-N approvals.",
    rules: {
      maxSinglePayoutSol: 2,
      monthlyBudgetSol: 10,
      approvalThreshold: 2,
      requireReason: true,
      allowNonMembersToRequest: false,
    },
  },
  {
    id: "fast-launchpad",
    name: "Fast Launchpad",
    risk: "Loose",
    description: "Higher limits and open requests for fast-moving launch ops.",
    rules: {
      maxSinglePayoutSol: 5,
      monthlyBudgetSol: 25,
      approvalThreshold: 2,
      requireReason: true,
      allowNonMembersToRequest: true,
    },
  },
  {
    id: "grant-program",
    name: "Grant Program",
    risk: "Balanced",
    description: "Room for grants with 3 approvals and open external requests.",
    rules: {
      maxSinglePayoutSol: 3,
      monthlyBudgetSol: 20,
      approvalThreshold: 3,
      requireReason: true,
      allowNonMembersToRequest: true,
    },
  },
  {
    id: "memecoin-ops",
    name: "Memecoin Ops",
    risk: "Balanced",
    description: "Modest limits for community/memecoin treasury operations.",
    rules: {
      maxSinglePayoutSol: 1.5,
      monthlyBudgetSol: 8,
      approvalThreshold: 2,
      requireReason: true,
      allowNonMembersToRequest: false,
    },
  },
];

export const RISK_STYLES: Record<TemplateRisk, string> = {
  Strict: "bg-[#D6F2E1] text-[#218a52]",
  Balanced: "bg-[#EAE6FF] text-[#5b4bd6]",
  Loose: "bg-[#FFE0E5] text-[#c24d63]",
};
