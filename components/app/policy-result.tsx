"use client";

import { CheckCircle2, MinusCircle, ShieldAlert } from "lucide-react";
import { PolicyResult } from "@/lib/policy";
import { cn } from "@/lib/utils";

/** A single rule row: green check (pass), red warning (fail), gray dash (n/a). */
export function PolicyRow({
  label,
  detail,
  state,
}: {
  label: string;
  detail: string;
  state: "pass" | "fail" | "na";
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      {state === "pass" && (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
      )}
      {state === "fail" && (
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
      )}
      {state === "na" && (
        <MinusCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      )}
      <div className="min-w-0">
        <p
          className={cn(
            "text-sm font-medium",
            state === "fail" ? "text-destructive" : "text-foreground",
          )}
        >
          {label}
        </p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

export function PolicyResultView({ result }: { result: PolicyResult }) {
  return (
    <div>
      <div
        className={cn(
          "rounded-xl border p-4",
          result.passed
            ? "border-success/25 bg-success/10"
            : "border-destructive/25 bg-destructive/10",
        )}
      >
        <p
          className={cn(
            "flex items-center gap-2 text-sm font-semibold",
            result.passed ? "text-success" : "text-destructive",
          )}
        >
          {result.passed ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <ShieldAlert className="size-4" />
          )}
          {result.passed
            ? "This payout can be requested"
            : "This payout would be blocked"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {result.checks.filter((c) => c.passed).length} of{" "}
          {result.checks.length} rules pass.
        </p>
      </div>

      <div className="mt-3 divide-y divide-border rounded-xl border border-border px-4">
        {result.checks.map((c) => (
          <PolicyRow
            key={c.label}
            label={c.label}
            detail={c.detail}
            state={c.passed ? "pass" : "fail"}
          />
        ))}
      </div>
    </div>
  );
}
