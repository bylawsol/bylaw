"use client";

import * as React from "react";
import { z } from "zod";
import { CheckCircle2, Plus, Send, ShieldAlert, X } from "lucide-react";
import { useTreasury } from "@/components/treasury-provider";
import { useToast } from "@/components/ui/toast";
import {
  EmptyState,
  PageHeader,
  PageSkeleton,
  Spinner,
} from "@/components/app/ui-bits";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PayoutCard } from "@/components/app/payout-card";
import {
  PAYOUT_CATEGORIES,
  PayoutCategory,
  PayoutStatus,
} from "@/lib/types";
import { evaluatePolicy } from "@/lib/policy";
import { isValidSolanaAddress } from "@/lib/utils";
import { NETWORK_LABEL_LOWER } from "@/lib/network";

const FILTERS: (PayoutStatus | "All")[] = [
  "All",
  "Pending Approval",
  "Policy Blocked",
  "Executed",
  "Rejected",
];

export default function PayoutsPage() {
  const { treasury, loading, wallet, createPayout } = useTreasury();
  const toast = useToast();

  const [showForm, setShowForm] = React.useState(false);
  const [recipient, setRecipient] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [category, setCategory] = React.useState<PayoutCategory>("Contributor");
  const [reason, setReason] = React.useState("");
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [filter, setFilter] = React.useState<PayoutStatus | "All">("All");

  // Prefill + open the form when arriving from the simulator (?new=1&...).
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("new") !== "1") return;
    setShowForm(true);
    if (p.get("recipient")) setRecipient(p.get("recipient") as string);
    if (p.get("amount") && p.get("amount") !== "0")
      setAmount(p.get("amount") as string);
    const cat = p.get("category");
    if (cat && (PAYOUT_CATEGORIES as string[]).includes(cat))
      setCategory(cat as PayoutCategory);
    if (p.get("reason")) setReason(p.get("reason") as string);
    window.history.replaceState({}, "", "/app/payouts");
  }, []);

  const amountNum = amount === "" ? NaN : Number(amount);

  // Live policy preview.
  const preview = React.useMemo(() => {
    if (!treasury) return null;
    if (!recipient && Number.isNaN(amountNum)) return null;
    return evaluatePolicy(treasury, {
      recipient: recipient.trim(),
      amountSol: Number.isNaN(amountNum) ? 0 : amountNum,
      reason,
      requester: wallet || "unknown",
    });
  }, [treasury, recipient, amountNum, reason, wallet]);

  if (loading || !treasury) return <PageSkeleton />;

  const resetForm = () => {
    setRecipient("");
    setAmount("");
    setCategory("Contributor");
    setReason("");
    setNote("");
  };

  const onSubmit = async () => {
    if (!isValidSolanaAddress(recipient.trim())) {
      toast.error("Invalid recipient", "Enter a valid Solana wallet address.");
      return;
    }
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      toast.error("Invalid amount", "Enter an amount greater than 0.");
      return;
    }
    setSubmitting(true);
    try {
      const { policy } = await createPayout({
        recipient: recipient.trim(),
        amountSol: amountNum,
        category,
        reason: reason.trim(),
        note: note.trim() || undefined,
      });
      if (policy.passed) {
        toast.success("Payout created", "Policy passed — pending approval.");
      } else {
        const failed = policy.checks.filter((c) => !c.passed).map((c) => c.label);
        toast.error("Policy blocked", failed.join(", "));
      }
      resetForm();
      setShowForm(false);
    } catch (e) {
      toast.error("Could not create payout", (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const payouts = [...treasury.payouts]
    .filter((p) => filter === "All" || p.status === filter)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  return (
    <div>
      <PageHeader
        title="Payouts"
        description={`Create requests, collect wallet-signed approvals, and execute on Solana ${NETWORK_LABEL_LOWER}. Every payout needs a reason.`}
        action={
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
            {showForm ? "Close" : "New payout"}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>New payout request</CardTitle>
            <CardDescription>
              The policy engine runs on submit. A blocked request is still saved
              with its reasons.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Recipient wallet address</Label>
                    <Input
                      placeholder="Solana wallet address"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Amount (SOL)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.0001"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select
                      value={category}
                      onChange={(e) =>
                        setCategory(e.target.value as PayoutCategory)
                      }
                    >
                      {PAYOUT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Reason{" "}
                    {treasury.bylaws.requireReason && (
                      <span className="text-destructive">*</span>
                    )}
                  </Label>
                  <Textarea
                    placeholder="Why is this payout happening?"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Note (optional)</Label>
                  <Input
                    placeholder="Internal note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={onSubmit} disabled={submitting}>
                    {submitting ? <Spinner /> : <Send className="size-4" />}
                    Submit request
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Clear
                  </Button>
                </div>
              </div>

              {/* Live policy preview */}
              <div>
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Policy preview</p>
                    {preview &&
                      (preview.passed ? (
                        <Badge variant="success">Would pass</Badge>
                      ) : (
                        <Badge variant="destructive">Would block</Badge>
                      ))}
                  </div>
                  <div className="mt-3 space-y-2">
                    {!preview ? (
                      <p className="text-xs text-muted-foreground">
                        Enter a recipient and amount to preview the policy check.
                      </p>
                    ) : (
                      preview.checks.map((c) => (
                        <div key={c.label} className="flex items-start gap-2">
                          {c.passed ? (
                            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                          ) : (
                            <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                          )}
                          <div>
                            <p className="text-xs font-medium">{c.label}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {c.detail}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count =
            f === "All"
              ? treasury.payouts.length
              : treasury.payouts.filter((p) => p.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
                (filter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground")
              }
            >
              {f} <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {payouts.length === 0 ? (
        <EmptyState
          icon={Send}
          title={
            filter === "All" ? "No payouts yet" : `No ${filter.toLowerCase()} payouts`
          }
          description={
            filter === "All"
              ? "Create your first payout request. The policy engine will check it against your bylaws."
              : "Try a different filter."
          }
          action={
            filter === "All" ? (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="size-4" /> New payout
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {payouts.map((p) => (
            <PayoutCard key={p.id} payout={p} treasury={treasury} />
          ))}
        </div>
      )}
    </div>
  );
}
