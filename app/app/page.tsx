"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Coins,
  ListChecks,
  ScrollText,
  Send,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { useTreasury } from "@/components/treasury-provider";
import {
  CopyButton,
  EmptyState,
  PageHeader,
  PageSkeleton,
  StatCard,
} from "@/components/app/ui-bits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/status-pill";
import { executedThisMonth } from "@/lib/policy";
import { formatSol, shortAddress, timeAgo } from "@/lib/utils";
import { MonthlySpendChart } from "@/components/app/monthly-chart";
import { AuditRow } from "@/components/app/audit-row";

export default function DashboardPage() {
  const { treasury, loading } = useTreasury();

  if (loading) return <PageSkeleton />;
  if (!treasury) {
    return (
      <EmptyState
        icon={Wallet}
        title="No treasury yet"
        description="Create your first treasury to start defining rules and submitting payouts."
        action={
          <Link href="/app/setup">
            <Button>Create treasury</Button>
          </Link>
        }
      />
    );
  }

  const spent = executedThisMonth(treasury);
  const pending = treasury.payouts.filter(
    (p) => p.status === "Pending Approval",
  );
  const blocked = treasury.payouts.filter((p) => p.status === "Policy Blocked");
  const recentPayouts = [...treasury.payouts]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);
  const recentEvents = [...treasury.auditEvents]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 6);

  return (
    <div>
      <PageHeader
        title={treasury.name}
        description={treasury.description}
        action={
          <Link href="/app/payouts">
            <Button>
              <Send className="size-4" /> New payout
            </Button>
          </Link>
        }
      />

      {/* Treasury wallet strip */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg border border-border">
              <Wallet className="size-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Treasury wallet</p>
              <p className="font-mono text-sm">
                {shortAddress(treasury.treasuryWalletAddress, 6)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Approval threshold</p>
              <p className="text-sm font-medium">
                {treasury.bylaws.approvalThreshold} of {treasury.members.length || "—"}
              </p>
            </div>
            <CopyButton
              value={treasury.treasuryWalletAddress}
              label="Copy"
              className="rounded-md border border-border px-3 py-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Executed this month"
          value={`${formatSol(spent)} SOL`}
          sub={`of ${formatSol(treasury.bylaws.monthlyBudgetSol)} SOL budget`}
          icon={Coins}
          accent="#FF8FA3"
        />
        <StatCard
          label="Pending payouts"
          value={pending.length}
          sub="awaiting approval"
          icon={Clock}
          accent="#B8B3FF"
        />
        <StatCard
          label="Policy blocked"
          value={blocked.length}
          sub="failed policy checks"
          icon={ShieldAlert}
          accent="#9FB6FF"
        />
        <StatCard
          label="Approval threshold"
          value={treasury.bylaws.approvalThreshold}
          sub="signatures required"
          icon={ListChecks}
          accent="#31B36B"
        />
      </div>

      {/* Chart + recent payouts */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly executed spend</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlySpendChart treasury={treasury} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent payouts</CardTitle>
            <Link
              href="/app/payouts"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPayouts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payouts yet.</p>
            ) : (
              recentPayouts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {formatSol(p.amountSol)} SOL · {p.category}
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {shortAddress(p.recipient)}
                    </p>
                  </div>
                  <StatusPill status={p.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent audit */}
      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="size-4" /> Recent activity
          </CardTitle>
          <Link
            href="/app/audit"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Full audit log <ArrowRight className="size-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {recentEvents.map((e) => (
                <AuditRow key={e.id} event={e} compact />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
