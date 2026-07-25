"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Copy, ExternalLink, ScrollText } from "lucide-react";
import { useTreasury } from "@/components/treasury-provider";
import { PageSkeleton, EmptyState } from "@/components/app/ui-bits";
import { PayoutCard } from "@/components/app/payout-card";
import { AuditRow } from "@/components/app/audit-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export default function PayoutDetailPage() {
  const params = useParams<{ id: string }>();
  const { treasury, loading } = useTreasury();
  const [copied, setCopied] = React.useState(false);

  if (loading || !treasury) return <PageSkeleton />;

  const payout = treasury.payouts.find((p) => p.id === params.id);

  if (!payout) {
    return (
      <EmptyState
        icon={Send}
        title="Payout not found"
        description="This payout isn't part of the active treasury."
        action={
          <Link href="/app/payouts">
            <Button>Back to payouts</Button>
          </Link>
        }
      />
    );
  }

  const events = treasury.auditEvents
    .filter((e) => (e.meta as { payoutId?: string })?.payoutId === payout.id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const receiptPath = `/receipt/${payout.id}`;
  const copyReceipt = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard
      ?.writeText(`${window.location.origin}${receiptPath}`)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/app/payouts"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All payouts
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={copyReceipt}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-accent"
          >
            {copied ? (
              <Check className="size-3.5 text-success" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Link copied" : "Share receipt"}
          </button>
          <Link href={receiptPath} target="_blank">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-accent">
              <ExternalLink className="size-3.5" /> Public receipt
            </span>
          </Link>
        </div>
      </div>

      <PayoutCard payout={payout} treasury={treasury} />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="size-4" /> Audit timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No audit events recorded for this payout yet.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {events.map((e) => (
                <AuditRow key={e.id} event={e} compact />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
