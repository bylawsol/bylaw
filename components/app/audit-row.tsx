"use client";

import {
  CheckCircle2,
  FileText,
  Gavel,
  Send,
  ShieldAlert,
  ShieldCheck,
  UserMinus,
  UserPlus,
  XCircle,
} from "lucide-react";
import { AuditEvent, AuditEventType } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, shortAddress, timeAgo } from "@/lib/utils";

const CONFIG: Record<
  AuditEventType,
  { icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  treasury_created: { icon: Gavel, label: "Treasury created" },
  bylaws_updated: { icon: FileText, label: "Bylaws updated" },
  member_added: { icon: UserPlus, label: "Member added" },
  member_removed: { icon: UserMinus, label: "Member removed" },
  payout_created: { icon: Send, label: "Payout created" },
  payout_policy_passed: { icon: ShieldCheck, label: "Policy passed" },
  payout_policy_blocked: { icon: ShieldAlert, label: "Policy blocked" },
  payout_approved: { icon: CheckCircle2, label: "Payout approved" },
  payout_rejected: { icon: XCircle, label: "Payout rejected" },
  payout_executed: { icon: CheckCircle2, label: "Payout executed" },
};

export function eventLabel(type: AuditEventType): string {
  return CONFIG[type]?.label ?? type;
}

export function AuditRow({
  event,
  compact = false,
}: {
  event: AuditEvent;
  compact?: boolean;
}) {
  const cfg = CONFIG[event.type] ?? { icon: FileText, label: event.type };
  const Icon = cfg.icon;
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-background">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-medium">{cfg.label}</span>
          {!compact && (
            <Badge variant="muted" className="font-mono text-[10px]">
              {event.type}
            </Badge>
          )}
        </div>
        <p className="mt-0.5 break-words text-sm text-muted-foreground">
          {event.detail}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          <span className="font-mono">{shortAddress(event.actor)}</span>
          {" · "}
          <span title={formatDateTime(event.createdAt)}>
            {timeAgo(event.createdAt)}
          </span>
        </p>
      </div>
    </div>
  );
}
