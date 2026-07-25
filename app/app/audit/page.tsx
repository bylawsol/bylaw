"use client";

import * as React from "react";
import { Download, ScrollText } from "lucide-react";
import { useTreasury } from "@/components/treasury-provider";
import { useToast } from "@/components/ui/toast";
import { EmptyState, PageHeader, PageSkeleton } from "@/components/app/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { AuditRow, eventLabel } from "@/components/app/audit-row";
import { AuditEventType } from "@/lib/types";

const EVENT_TYPES: AuditEventType[] = [
  "treasury_created",
  "bylaws_updated",
  "member_added",
  "member_removed",
  "payout_created",
  "payout_policy_passed",
  "payout_policy_blocked",
  "payout_approved",
  "payout_rejected",
  "payout_executed",
];

export default function AuditPage() {
  const { treasury, loading } = useTreasury();
  const toast = useToast();
  const [filter, setFilter] = React.useState<AuditEventType | "all">("all");

  if (loading || !treasury) return <PageSkeleton />;

  const events = [...treasury.auditEvents]
    .filter((e) => filter === "all" || e.type === filter)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(treasury.auditEvents, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bylaw-audit-${treasury.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported");
  };

  return (
    <div>
      <PageHeader
        title="Audit log"
        description="Every treasury action, in order. The audit log is the product."
        action={
          <Button variant="outline" onClick={exportJson}>
            <Download className="size-4" /> Export JSON
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {events.length} event{events.length === 1 ? "" : "s"}
          {filter !== "all" && ` · ${eventLabel(filter)}`}
        </p>
        <div className="w-full sm:w-64">
          <Select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as AuditEventType | "all")
            }
          >
            <option value="all">All event types</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {eventLabel(t)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No events"
          description={
            filter === "all"
              ? "Actions will appear here as they happen."
              : "No events of this type yet."
          }
        />
      ) : (
        <Card>
          <CardContent className="p-5">
            <div className="divide-y divide-border">
              {events.map((e) => (
                <AuditRow key={e.id} event={e} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
