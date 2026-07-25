"use client";

import * as React from "react";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/status-pill";
import { PolicyRow } from "@/components/app/policy-result";
import { AuditRow } from "@/components/app/audit-row";
import { Payout, Treasury } from "@/lib/types";
import { explorerAddressUrl, explorerTxUrl } from "@/lib/solana";
import { NETWORK_LABEL_LOWER } from "@/lib/network";
import { cn, formatDateTime, formatSol, shortAddress } from "@/lib/utils";

function parseReason(r: string): { pass: boolean; label: string; detail: string } {
  const pass = r.startsWith("PASS");
  const rest = r.replace(/^(PASS|FAIL) — /, "");
  const idx = rest.indexOf(": ");
  return {
    pass,
    label: idx >= 0 ? rest.slice(0, idx) : rest,
    detail: idx >= 0 ? rest.slice(idx + 2) : "",
  };
}

export function ReceiptView({
  treasury,
  payout,
  className,
}: {
  treasury: Treasury;
  payout: Payout;
  className?: string;
}) {
  const threshold = treasury.bylaws.approvalThreshold;
  const events = treasury.auditEvents
    .filter((e) => (e.meta as { payoutId?: string })?.payoutId === payout.id)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  const exportJson = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          { treasury: treasury.name, treasuryType: treasury.treasuryType, payout, events },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bylaw-receipt-${payout.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[24px] border border-black/10 bg-[#FFFDF7] shadow-[0_30px_70px_-40px_rgba(60,40,110,0.4)]",
        className,
      )}
    >
      {/* pastel pixel accent strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#FF8FA3] via-[#B8B3FF] to-[#9FB6FF]" />

      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <Logo />
          {payout.demo ? (
            <Badge variant="warning">Demo receipt</Badge>
          ) : (
            <Badge variant="muted">Payout receipt</Badge>
          )}
        </div>

        <p className="mt-6 text-sm text-[#66625C]">
          {treasury.name}
          {treasury.treasuryType ? ` · ${treasury.treasuryType}` : ""}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <span className="text-4xl font-semibold tracking-tight text-[#242424]">
            {formatSol(payout.amountSol)} SOL
          </span>
          <StatusPill status={payout.status} />
        </div>

        {/* details */}
        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-black/[0.08] pt-6 sm:grid-cols-2">
          <Detail label="Recipient">
            <a
              href={explorerAddressUrl(payout.recipient)}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-sm hover:underline"
            >
              {shortAddress(payout.recipient, 8)}
            </a>
          </Detail>
          <Detail label="Requester">
            <span className="font-mono text-sm">
              {shortAddress(payout.requester, 8)}
            </span>
          </Detail>
          <Detail label="Category">{payout.category}</Detail>
          <Detail label="Created">{formatDateTime(payout.createdAt)}</Detail>
          {payout.executedAt && (
            <Detail label="Executed">{formatDateTime(payout.executedAt)}</Detail>
          )}
          <Detail label="Approvals">
            {payout.approvals.length} of {threshold}
          </Detail>
        </div>

        {payout.reason && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8a857d]">
              Reason
            </p>
            <p className="mt-1 text-sm text-[#242424]">{payout.reason}</p>
          </div>
        )}

        {/* policy */}
        <div className="mt-6">
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8a857d]">
            Policy result{" "}
            {payout.policyPassed ? (
              <span className="inline-flex items-center gap-1 text-success">
                <CheckCircle2 className="size-3.5" /> Passed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-destructive">
                <ShieldAlert className="size-3.5" /> Blocked
              </span>
            )}
          </p>
          <div className="divide-y divide-black/[0.06] rounded-xl border border-black/10 px-4">
            {payout.policyReasons.map((r, i) => {
              const p = parseReason(r);
              return (
                <PolicyRow
                  key={i}
                  label={p.label}
                  detail={p.detail}
                  state={p.pass ? "pass" : "fail"}
                />
              );
            })}
          </div>
        </div>

        {/* approvals / signatures */}
        {payout.approvals.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8a857d]">
              Approval signatures
            </p>
            <div className="mt-2 space-y-1.5">
              {payout.approvals.map((a, i) => {
                const label =
                  treasury.members.find(
                    (m) =>
                      m.walletAddress.toLowerCase() ===
                      a.signerAddress.toLowerCase(),
                  )?.label ?? shortAddress(a.signerAddress);
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-lg border border-black/[0.08] bg-white px-3 py-2"
                  >
                    <span className="text-sm font-medium">{label}</span>
                    <span className="font-mono text-xs text-[#8a857d]">
                      sig {shortAddress(a.signature, 6)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* transaction */}
        {payout.txSignature && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8a857d]">
              Transaction
            </p>
            {payout.demo ? (
              <p className="mt-1 text-sm text-[#66625C]">
                Demo execution — not a real transaction, no explorer link.
              </p>
            ) : (
              <a
                href={explorerTxUrl(payout.txSignature)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-[#5b4bd6] hover:underline"
              >
                <ExternalLink className="size-3.5" /> View on Solana Explorer (
                {NETWORK_LABEL_LOWER})
              </a>
            )}
          </div>
        )}

        {/* audit timeline */}
        {events.length > 0 && (
          <div className="mt-6">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#8a857d]">
              Audit timeline
            </p>
            <div className="divide-y divide-black/[0.06] rounded-xl border border-black/10 px-4">
              {events.map((e) => (
                <AuditRow key={e.id} event={e} compact />
              ))}
            </div>
          </div>
        )}

        {/* footer */}
        <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-black/[0.08] pt-5 sm:flex-row sm:items-center">
          <p className="text-xs text-[#8a857d]">
            Solana {NETWORK_LABEL_LOWER} MVP. Not a custodial multisig.
          </p>
          <button
            onClick={exportJson}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-medium text-[#242424] hover:bg-black/5"
          >
            <Download className="size-3.5" /> Export JSON
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[#8a857d]">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[#242424]">{children}</p>
    </div>
  );
}
