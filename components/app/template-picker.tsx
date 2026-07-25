"use client";

import { Check } from "lucide-react";
import { RISK_STYLES, RULE_TEMPLATES, RuleTemplate } from "@/lib/templates";
import { cn } from "@/lib/utils";

export function TemplatePicker({
  onApply,
  activeId,
  className,
}: {
  onApply: (t: RuleTemplate) => void;
  activeId?: string;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
      {RULE_TEMPLATES.map((t) => {
        const active = activeId === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onApply(t)}
            className={cn(
              "group rounded-xl border p-4 text-left transition-colors",
              active
                ? "border-[#242424] bg-white"
                : "border-black/10 bg-white/60 hover:bg-white",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-[#242424]">
                {t.name}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                  RISK_STYLES[t.risk],
                )}
              >
                {t.risk}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-[#66625C]">{t.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-[#57534c]">
              <Chip>{t.rules.maxSinglePayoutSol} SOL max</Chip>
              <Chip>{t.rules.monthlyBudgetSol} SOL / mo</Chip>
              <Chip>{t.rules.approvalThreshold} approvals</Chip>
            </div>
            <span
              className={cn(
                "mt-3 inline-flex items-center gap-1 text-xs font-medium",
                active ? "text-success" : "text-[#8a857d] group-hover:text-[#242424]",
              )}
            >
              {active ? (
                <>
                  <Check className="size-3.5" /> Applied
                </>
              ) : (
                "Apply template"
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-black/10 bg-white px-1.5 py-0.5">
      {children}
    </span>
  );
}
