"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FlaskConical, Play } from "lucide-react";
import { useTreasury } from "@/components/treasury-provider";
import { PageHeader, PageSkeleton } from "@/components/app/ui-bits";
import { PolicyResultView } from "@/components/app/policy-result";
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
import { PAYOUT_CATEGORIES, PayoutCategory } from "@/lib/types";
import { evaluatePolicy, PolicyResult } from "@/lib/policy";
import { currentMonthKey } from "@/lib/utils";

export default function SimulatorPage() {
  const router = useRouter();
  const { treasury, loading, wallet } = useTreasury();

  const defaultRequester =
    wallet ??
    treasury?.members.find((m) => m.role === "Admin")?.walletAddress ??
    "";

  const [recipient, setRecipient] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [category, setCategory] = React.useState<PayoutCategory>("Contributor");
  const [reason, setReason] = React.useState("");
  const [requester, setRequester] = React.useState("");
  const [month, setMonth] = React.useState(currentMonthKey());
  const [result, setResult] = React.useState<PolicyResult | null>(null);

  React.useEffect(() => {
    if (defaultRequester && !requester) setRequester(defaultRequester);
  }, [defaultRequester, requester]);

  if (loading || !treasury) return <PageSkeleton />;

  const amountNum = amount === "" ? 0 : Number(amount);

  const run = () => {
    const asOf = /^\d{4}-\d{2}$/.test(month)
      ? new Date(`${month}-15T12:00:00`)
      : undefined;
    setResult(
      evaluatePolicy(
        treasury,
        {
          recipient: recipient.trim(),
          amountSol: Number.isNaN(amountNum) ? 0 : amountNum,
          reason,
          requester: requester.trim() || "unknown",
        },
        asOf,
      ),
    );
  };

  const createFromSim = () => {
    const params = new URLSearchParams({
      new: "1",
      recipient: recipient.trim(),
      amount: String(amountNum),
      category,
      reason,
    });
    router.push(`/app/payouts?${params.toString()}`);
  };

  return (
    <div>
      <PageHeader
        title="Policy simulator"
        description="Test whether a payout would pass or fail before you create it. Uses the same policy engine as real payouts."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="size-4" /> Simulate a payout
            </CardTitle>
            <CardDescription>
              Nothing is created — this only runs the checks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Recipient wallet address</Label>
              <Input
                placeholder="Solana wallet address"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  onChange={(e) => setCategory(e.target.value as PayoutCategory)}
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
              <Label>Reason</Label>
              <Textarea
                placeholder="Why is this payout happening?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Requester wallet</Label>
                <Input
                  placeholder="Requester address"
                  value={requester}
                  onChange={(e) => setRequester(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Month</Label>
                <Input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={run} className="w-full">
              <Play className="size-4" /> Run policy check
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
            <CardDescription>Rule-by-rule breakdown.</CardDescription>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border text-center">
                <FlaskConical className="size-6 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Fill the form and run a check to see the result.
                </p>
              </div>
            ) : (
              <div>
                <PolicyResultView result={result} />
                {result.passed && (
                  <Button onClick={createFromSim} className="mt-4 w-full">
                    Create payout from simulation{" "}
                    <ArrowRight className="size-4" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
