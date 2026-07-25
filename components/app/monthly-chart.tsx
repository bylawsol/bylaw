"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Treasury } from "@/lib/types";
import { monthKey } from "@/lib/utils";
import { NETWORK_LABEL_LOWER } from "@/lib/network";

/** Executed SOL grouped by the last 6 calendar months. */
function buildData(treasury: Treasury) {
  const months: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: monthKey(d),
      label: d.toLocaleString("en-US", { month: "short" }),
    });
  }
  const totals: Record<string, number> = {};
  for (const p of treasury.payouts) {
    if (p.status === "Executed" && p.executedAt) {
      const k = monthKey(p.executedAt);
      totals[k] = (totals[k] ?? 0) + p.amountSol;
    }
  }
  return months.map((m) => ({
    month: m.label,
    sol: Number((totals[m.key] ?? 0).toFixed(4)),
  }));
}

export function MonthlySpendChart({ treasury }: { treasury: Treasury }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const data = React.useMemo(() => buildData(treasury), [treasury]);
  const hasSpend = data.some((d) => d.sol > 0);

  if (!mounted) {
    return <div className="h-56 w-full animate-pulse rounded-md bg-muted" />;
  }

  return (
    <div className="h-56 w-full">
      {!hasSpend && (
        <p className="mb-2 text-xs text-muted-foreground">
          No executed payouts yet. Bars fill in as payouts are executed on{" "}
          {NETWORK_LABEL_LOWER}.
        </p>
      )}
      <ResponsiveContainer width="100%" height={hasSpend ? "100%" : 180}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="bylawBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B8B3FF" />
              <stop offset="100%" stopColor="#FF8FA3" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="hsl(40 16% 85%)" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            stroke="hsl(38 7% 45%)"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={12}
            stroke="hsl(38 7% 45%)"
            width={40}
          />
          <Tooltip
            cursor={{ fill: "hsl(42 22% 88%)" }}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid hsl(40 16% 85%)",
              background: "hsl(45 48% 98%)",
              fontSize: 12,
            }}
            formatter={(v: number) => [`${v} SOL`, "Executed"]}
          />
          <Bar dataKey="sol" fill="url(#bylawBar)" radius={[5, 5, 0, 0]} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
