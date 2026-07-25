"use client";

import * as React from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Ban,
  Check,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  PenLine,
  Play,
  Share2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Payout, Treasury } from "@/lib/types";
import { useTreasury } from "@/components/treasury-provider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { StatusPill } from "@/components/status-pill";
import { CopyButton, Spinner } from "@/components/app/ui-bits";
import { canApprove, canExecutePayout } from "@/lib/policy";
import {
  buildApprovalMessage,
  executeTransfer,
  explorerAddressUrl,
  explorerTxUrl,
} from "@/lib/solana";
import { NETWORK_LABEL_LOWER } from "@/lib/network";
import { bytesToBase58, formatDateTime, formatSol, shortAddress, timeAgo } from "@/lib/utils";

export function PayoutCard({
  payout,
  treasury,
}: {
  payout: Payout;
  treasury: Treasury;
}) {
  const walletCtx = useWallet();
  const { wallet, addApproval, rejectPayout, markExecuted } = useTreasury();
  const toast = useToast();

  const [expanded, setExpanded] = React.useState(false);
  const [approving, setApproving] = React.useState(false);
  const [executing, setExecuting] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [shared, setShared] = React.useState(false);

  const shareReceipt = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard
      ?.writeText(`${window.location.origin}/receipt/${payout.id}`)
      .then(() => {
        setShared(true);
        setTimeout(() => setShared(false), 1500);
        toast.success("Receipt link copied");
      });
  };

  const threshold = treasury.bylaws.approvalThreshold;
  const approvals = payout.approvals.length;
  const alreadyApproved =
    wallet != null &&
    payout.approvals.some(
      (a) => a.signerAddress.toLowerCase() === wallet.toLowerCase(),
    );
  const approverAllowed = canApprove(treasury, wallet);
  const exec = canExecutePayout(treasury, payout, wallet);

  const isOpen = payout.status === "Pending Approval";

  const onApprove = async () => {
    if (!wallet) {
      toast.error("Connect a wallet to approve");
      return;
    }
    if (!approverAllowed) {
      toast.error("Not authorized", "Only Approvers or Admins can approve.");
      return;
    }
    if (alreadyApproved) {
      toast.info("Already approved", "This wallet already signed an approval.");
      return;
    }
    if (!walletCtx.signMessage) {
      toast.error("Wallet cannot sign messages", "Use Phantom to sign approvals.");
      return;
    }
    setApproving(true);
    try {
      const message = buildApprovalMessage({
        payoutId: payout.id,
        amountSol: payout.amountSol,
        recipient: payout.recipient,
        treasuryName: treasury.name,
        timestamp: new Date().toISOString(),
      });
      const encoded = new TextEncoder().encode(message);
      const sigBytes = await walletCtx.signMessage(encoded);
      const signature = bytesToBase58(sigBytes);
      await addApproval(payout.id, {
        signerAddress: wallet,
        signature,
        message,
      });
      toast.success("Approval signed", `${approvals + 1} of ${threshold} collected`);
    } catch (e) {
      const msg = (e as Error).message || "Signature was rejected.";
      toast.error("Approval failed", msg);
    } finally {
      setApproving(false);
    }
  };

  const onExecute = async () => {
    if (!exec.canExecute) {
      toast.error("Cannot execute", exec.reasons[0]);
      return;
    }
    setExecuting(true);
    try {
      toast.info(`Sending ${NETWORK_LABEL_LOWER} transfer`, "Approve the transaction in your wallet.");
      const sig = await executeTransfer(walletCtx, payout.recipient, payout.amountSol);
      await markExecuted(payout.id, sig);
      toast.success("Payout executed", `Confirmed on Solana ${NETWORK_LABEL_LOWER}.`);
    } catch (e) {
      toast.error("Execution failed", (e as Error).message);
    } finally {
      setExecuting(false);
    }
  };

  const onReject = async () => {
    if (!approverAllowed) {
      toast.error("Not authorized", "Only Approvers or Admins can reject.");
      return;
    }
    if (!rejectReason.trim()) {
      toast.error("Add a rejection reason");
      return;
    }
    try {
      await rejectPayout(payout.id, rejectReason.trim());
      toast.success("Payout rejected");
      setRejectOpen(false);
      setRejectReason("");
    } catch (e) {
      toast.error("Could not reject", (e as Error).message);
    }
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold">
                {formatSol(payout.amountSol)} SOL
              </span>
              <Badge variant="outline">{payout.category}</Badge>
              <StatusPill status={payout.status} />
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>To</span>
              <a
                href={explorerAddressUrl(payout.recipient)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-foreground hover:underline"
              >
                {shortAddress(payout.recipient, 6)}
              </a>
              <CopyButton value={payout.recipient} />
            </div>
            {payout.reason && (
              <p className="mt-2 max-w-prose text-sm">{payout.reason}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Requested by{" "}
              <span className="font-mono">{shortAddress(payout.requester)}</span>{" "}
              · <span title={formatDateTime(payout.createdAt)}>{timeAgo(payout.createdAt)}</span>
            </p>
          </div>

          {/* Approvals meter */}
          <div className="shrink-0 rounded-lg border border-border p-3 text-center sm:w-40">
            <p className="text-xs text-muted-foreground">Approvals</p>
            <p className="mt-1 text-2xl font-semibold">
              {approvals}
              <span className="text-base text-muted-foreground">/{threshold}</span>
            </p>
            <div className="mt-2 flex justify-center gap-1">
              {Array.from({ length: Math.max(threshold, approvals) }).map((_, i) => (
                <span
                  key={i}
                  className={
                    "size-2 rounded-full " +
                    (i < approvals ? "bg-success" : "bg-muted")
                  }
                />
              ))}
            </div>
          </div>
        </div>

        {/* Policy status + tx */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {payout.policyPassed ? (
            <Badge variant="success">
              <ShieldCheck className="size-3" /> Policy passed
            </Badge>
          ) : (
            <Badge variant="destructive">
              <ShieldAlert className="size-3" /> Policy blocked
            </Badge>
          )}
          {payout.txSignature && (
            <a
              href={explorerTxUrl(payout.txSignature)}
              target="_blank"
              rel="noreferrer"
            >
              <Badge variant="outline" className="hover:bg-accent">
                <ExternalLink className="size-3" /> View on Explorer
              </Badge>
            </a>
          )}
          <div className="ml-auto flex items-center gap-3">
            <Link
              href={`/app/payouts/${payout.id}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Details
            </Link>
            <button
              onClick={shareReceipt}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              title="Copy public receipt link"
            >
              {shared ? (
                <Check className="size-3 text-success" />
              ) : (
                <Share2 className="size-3" />
              )}
              {shared ? "Copied" : "Share receipt"}
            </button>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Policy details
              <ChevronDown
                className={"size-3 transition-transform " + (expanded ? "rotate-180" : "")}
              />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 space-y-1.5 rounded-lg border border-border bg-muted/30 p-3">
            {payout.policyReasons.map((r, i) => {
              const pass = r.startsWith("PASS");
              return (
                <p key={i} className="flex items-start gap-2 text-xs">
                  {pass ? (
                    <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-success" />
                  ) : (
                    <ShieldAlert className="mt-0.5 size-3 shrink-0 text-destructive" />
                  )}
                  <span className={pass ? "text-muted-foreground" : "text-destructive"}>
                    {r.replace(/^(PASS|FAIL) — /, "")}
                  </span>
                </p>
              );
            })}
            {payout.rejection && (
              <p className="pt-1 text-xs text-destructive">
                Rejected by {shortAddress(payout.rejection.rejectedBy)}:{" "}
                {payout.rejection.reason}
              </p>
            )}
            {payout.approvals.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-medium">Signed approvals</p>
                {payout.approvals.map((a, i) => (
                  <p key={i} className="font-mono text-[11px] text-muted-foreground break-all">
                    {shortAddress(a.signerAddress)} · sig {shortAddress(a.signature, 6)}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {payout.status !== "Executed" && payout.status !== "Rejected" && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={onApprove}
              disabled={approving || !isOpen || alreadyApproved || !approverAllowed}
              title={
                !approverAllowed
                  ? "Only Approvers or Admins can approve"
                  : alreadyApproved
                    ? "You already approved"
                    : undefined
              }
            >
              {approving ? <Spinner /> : <PenLine className="size-4" />}
              {alreadyApproved ? "Approved" : "Approve"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRejectOpen(true)}
              disabled={!approverAllowed || !isOpen}
            >
              <Ban className="size-4" /> Reject
            </Button>
            <Button
              size="sm"
              variant={exec.canExecute ? "default" : "outline"}
              onClick={onExecute}
              disabled={!exec.canExecute || executing}
              title={!exec.canExecute ? exec.reasons.join(" · ") : undefined}
            >
              {executing ? <Spinner /> : <Play className="size-4" />}
              Execute
            </Button>
          </div>
        )}
        {payout.status === "Pending Approval" &&
          !exec.canExecute &&
          exec.reasons.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              To execute: {exec.reasons.join(" · ")}
            </p>
          )}
      </CardContent>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject payout"
        description="Provide a reason. This is recorded in the audit log."
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onReject}>
              Reject payout
            </Button>
          </>
        }
      >
        <Textarea
          placeholder="Reason for rejection"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </Card>
  );
}
