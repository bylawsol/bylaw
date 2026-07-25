"use client";

import * as React from "react";
import Link from "next/link";
import { z } from "zod";
import { FlaskConical, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import { useTreasury } from "@/components/treasury-provider";
import { TemplatePicker } from "@/components/app/template-picker";
import { RuleTemplate } from "@/lib/templates";
import { useToast } from "@/components/ui/toast";
import { PageHeader, PageSkeleton, Spinner } from "@/components/app/ui-bits";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bylaws, DEFAULT_BYLAWS } from "@/lib/types";
import { formatSol, isValidSolanaAddress, shortAddress } from "@/lib/utils";

const bylawsSchema = z.object({
  maxSinglePayoutSol: z.number().positive("Must be greater than 0"),
  approvalThreshold: z
    .number()
    .int("Must be a whole number")
    .min(1, "At least 1 approval required"),
  monthlyBudgetSol: z.number().positive("Must be greater than 0"),
  requireReason: z.boolean(),
  allowNonMembersToRequest: z.boolean(),
  allowedRecipients: z.array(z.string()),
});

export default function BylawsPage() {
  const { treasury, loading, updateBylaws } = useTreasury();
  const toast = useToast();

  const [form, setForm] = React.useState<Bylaws | null>(null);
  const [newRecipient, setNewRecipient] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [templateId, setTemplateId] = React.useState<string | undefined>();

  const applyTemplate = (t: RuleTemplate) => {
    setForm((f) => (f ? { ...f, ...t.rules } : f));
    setTemplateId(t.id);
    toast.info("Template applied", "Review the values and Save to record it.");
  };

  React.useEffect(() => {
    if (treasury && !form) setForm({ ...treasury.bylaws });
  }, [treasury, form]);

  if (loading || !treasury || !form) return <PageSkeleton />;

  const set = <K extends keyof Bylaws>(key: K, value: Bylaws[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  };

  const num = (v: string) => (v === "" ? NaN : Number(v));

  const addRecipient = () => {
    const addr = newRecipient.trim();
    if (!isValidSolanaAddress(addr)) {
      toast.error("Invalid address", "Enter a valid Solana wallet address.");
      return;
    }
    if (form.allowedRecipients.some((r) => r === addr)) {
      toast.info("Already on the allowlist");
      return;
    }
    set("allowedRecipients", [...form.allowedRecipients, addr]);
    setNewRecipient("");
  };

  const removeRecipient = (addr: string) => {
    set(
      "allowedRecipients",
      form.allowedRecipients.filter((r) => r !== addr),
    );
  };

  const onSave = async () => {
    const parsed = bylawsSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errs[issue.path[0] as string] = issue.message;
      }
      setErrors(errs);
      toast.error("Fix the highlighted fields");
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await updateBylaws(parsed.data);
      toast.success("Bylaws saved", "An audit event was recorded.");
    } catch (e) {
      toast.error("Could not save", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const onReset = () => {
    setForm({ ...DEFAULT_BYLAWS });
    setErrors({});
    toast.info("Reset to defaults", "Save to apply the default bylaws.");
  };

  return (
    <div>
      <PageHeader
        title="Bylaws"
        description="Treasury rules before treasury spend. These rules run on every payout request."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={onReset}>
              <RotateCcw className="size-4" /> Reset to defaults
            </Button>
            <Button onClick={onSave} disabled={saving}>
              {saving ? <Spinner /> : <Save className="size-4" />} Save
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Rule templates</CardTitle>
                <CardDescription>
                  Apply a starting point, then fine-tune. Save to record it.
                </CardDescription>
              </div>
              <Link
                href="/app/simulator"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-accent"
              >
                <FlaskConical className="size-3.5" /> Test in simulator
              </Link>
            </CardHeader>
            <CardContent>
              <TemplatePicker onApply={applyTemplate} activeId={templateId} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limits</CardTitle>
              <CardDescription>
                Cap the size of any single payout and total monthly spend.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                label="Max single payout (SOL)"
                error={errors.maxSinglePayoutSol}
              >
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={Number.isNaN(form.maxSinglePayoutSol) ? "" : form.maxSinglePayoutSol}
                  onChange={(e) =>
                    set("maxSinglePayoutSol", num(e.target.value))
                  }
                />
              </Field>
              <Field
                label="Monthly budget (SOL)"
                error={errors.monthlyBudgetSol}
              >
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={Number.isNaN(form.monthlyBudgetSol) ? "" : form.monthlyBudgetSol}
                  onChange={(e) => set("monthlyBudgetSol", num(e.target.value))}
                />
              </Field>
              <Field
                label="Approval threshold"
                error={errors.approvalThreshold}
                hint="Number of wallet-signed approvals required to execute."
              >
                <Input
                  type="number"
                  min={1}
                  step="1"
                  value={Number.isNaN(form.approvalThreshold) ? "" : form.approvalThreshold}
                  onChange={(e) => set("approvalThreshold", num(e.target.value))}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recipient allowlist</CardTitle>
              <CardDescription>
                Optional. If empty, any valid Solana address may receive a
                payout. If set, only these addresses pass policy.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="Solana wallet address"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRecipient();
                    }
                  }}
                  className="font-mono"
                />
                <Button variant="outline" onClick={addRecipient}>
                  <Plus className="size-4" /> Add
                </Button>
              </div>
              <div className="mt-4 space-y-2">
                {form.allowedRecipients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No allowlist configured — any recipient is allowed.
                  </p>
                ) : (
                  form.allowedRecipients.map((r) => (
                    <div
                      key={r}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                    >
                      <span className="font-mono text-sm">{shortAddress(r, 8)}</span>
                      <button
                        onClick={() => removeRecipient(r)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Remove"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ToggleRow
                label="Require a reason"
                description="Every payout must include a reason. Every payout needs a reason."
                checked={form.requireReason}
                onChange={(v) => set("requireReason", v)}
              />
              <ToggleRow
                label="Allow non-members to request"
                description="If off, only treasury members may submit payout requests."
                checked={form.allowNonMembersToRequest}
                onChange={(v) => set("allowNonMembersToRequest", v)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Policy summary */}
        <div>
          <Card className="lg:sticky lg:top-24">
            <CardHeader>
              <CardTitle>Policy summary</CardTitle>
              <CardDescription>
                What the engine enforces with the current values.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <SummaryRow label="Max single payout">
                {Number.isNaN(form.maxSinglePayoutSol)
                  ? "—"
                  : `${formatSol(form.maxSinglePayoutSol)} SOL`}
              </SummaryRow>
              <SummaryRow label="Monthly budget">
                {Number.isNaN(form.monthlyBudgetSol)
                  ? "—"
                  : `${formatSol(form.monthlyBudgetSol)} SOL`}
              </SummaryRow>
              <SummaryRow label="Approvals required">
                {Number.isNaN(form.approvalThreshold)
                  ? "—"
                  : form.approvalThreshold}
              </SummaryRow>
              <SummaryRow label="Recipient allowlist">
                {form.allowedRecipients.length === 0 ? (
                  <Badge variant="muted">Open</Badge>
                ) : (
                  <Badge variant="outline">
                    {form.allowedRecipients.length} address
                    {form.allowedRecipients.length > 1 ? "es" : ""}
                  </Badge>
                )}
              </SummaryRow>
              <SummaryRow label="Reason required">
                {form.requireReason ? (
                  <Badge variant="success">Yes</Badge>
                ) : (
                  <Badge variant="muted">No</Badge>
                )}
              </SummaryRow>
              <SummaryRow label="Non-members can request">
                {form.allowNonMembersToRequest ? (
                  <Badge variant="warning">Yes</Badge>
                ) : (
                  <Badge variant="muted">No</Badge>
                )}
              </SummaryRow>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}
