"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CircleAlert,
  Plus,
  Rocket,
  Shield,
  Sparkles,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { WalletButton } from "@/components/app/wallet-button";
import { Spinner } from "@/components/app/ui-bits";
import { TemplatePicker } from "@/components/app/template-picker";
import { RuleTemplate } from "@/lib/templates";
import { NETWORK_LABEL } from "@/lib/network";
import { useToast } from "@/components/ui/toast";
import {
  NewMemberInput,
  useTreasury,
} from "@/components/treasury-provider";
import {
  DEFAULT_BYLAWS,
  MEMBER_ROLES,
  MemberRole,
  TREASURY_TYPES,
  TreasuryType,
} from "@/lib/types";
import { cn, isValidSolanaAddress, shortAddress } from "@/lib/utils";

const STEPS = ["Identity", "Members", "Rules", "Review"] as const;

// Valid devnet addresses used only when the user opts into demo members.
const DEMO_MEMBERS: NewMemberInput[] = [
  {
    walletAddress: "36Y9zUDMx2JuK9DmZn9ibKh6ZCcMEtsGpXcVXW7Dbbuq",
    label: "Demo approver 1",
    role: "Approver",
  },
  {
    walletAddress: "68SyADuFWerx5JKnGSk6HaeZh5UxaLhkv3zaVNaxC4nD",
    label: "Demo approver 2",
    role: "Approver",
  },
];

export default function SetupWizard() {
  const router = useRouter();
  const toast = useToast();
  const { wallet, createTreasury, mode } = useTreasury();

  const [step, setStep] = React.useState(0);
  const [creating, setCreating] = React.useState(false);

  // Step 1 — identity
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [treasuryType, setTreasuryType] = React.useState<TreasuryType>("DAO");

  // Step 2 — members (additional to the connected admin)
  const [members, setMembers] = React.useState<NewMemberInput[]>([]);
  const [mAddr, setMAddr] = React.useState("");
  const [mLabel, setMLabel] = React.useState("");
  const [mRole, setMRole] = React.useState<MemberRole>("Approver");

  // Step 3 — rules
  const [maxSingle, setMaxSingle] = React.useState(
    String(DEFAULT_BYLAWS.maxSinglePayoutSol),
  );
  const [monthly, setMonthly] = React.useState(
    String(DEFAULT_BYLAWS.monthlyBudgetSol),
  );
  const [threshold, setThreshold] = React.useState(
    String(DEFAULT_BYLAWS.approvalThreshold),
  );
  const [requireReason, setRequireReason] = React.useState(
    DEFAULT_BYLAWS.requireReason,
  );
  const [allowNonMembers, setAllowNonMembers] = React.useState(
    DEFAULT_BYLAWS.allowNonMembersToRequest,
  );
  const [useAllowlist, setUseAllowlist] = React.useState(false);
  const [templateId, setTemplateId] = React.useState<string | undefined>();

  const applyTemplate = (t: RuleTemplate) => {
    setMaxSingle(String(t.rules.maxSinglePayoutSol));
    setMonthly(String(t.rules.monthlyBudgetSol));
    setThreshold(String(t.rules.approvalThreshold));
    setRequireReason(t.rules.requireReason);
    setAllowNonMembers(t.rules.allowNonMembersToRequest);
    setTemplateId(t.id);
  };

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const num = (v: string) => (v.trim() === "" ? NaN : Number(v));

  // Full member list for review / counts (connected wallet is the first Admin).
  const reviewMembers: NewMemberInput[] = React.useMemo(
    () => [
      ...(wallet
        ? [{ walletAddress: wallet, label: "You (creator)", role: "Admin" as MemberRole }]
        : []),
      ...members,
    ],
    [wallet, members],
  );
  const approverCount = reviewMembers.filter(
    (m) => m.role === "Admin" || m.role === "Approver",
  ).length;
  const thresholdNum = num(threshold);

  const addMember = () => {
    const addr = mAddr.trim();
    if (!isValidSolanaAddress(addr)) {
      toast.error("Invalid address", "Enter a valid Solana wallet address.");
      return;
    }
    if (wallet && addr.toLowerCase() === wallet.toLowerCase()) {
      toast.info("That's your wallet", "You're already the first Admin.");
      return;
    }
    if (members.some((m) => m.walletAddress.toLowerCase() === addr.toLowerCase())) {
      toast.info("Already added");
      return;
    }
    setMembers((prev) => [
      ...prev,
      { walletAddress: addr, label: mLabel.trim() || "Member", role: mRole },
    ]);
    setMAddr("");
    setMLabel("");
    setMRole("Approver");
  };

  const addDemoMembers = () => {
    setMembers((prev) => {
      const existing = new Set(prev.map((m) => m.walletAddress.toLowerCase()));
      const add = DEMO_MEMBERS.filter(
        (d) => !existing.has(d.walletAddress.toLowerCase()),
      );
      return [...prev, ...add];
    });
    toast.success("Demo members added", "You can remove them anytime.");
  };

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!name.trim()) e.name = "Give your treasury a name.";
    }
    if (s === 2) {
      if (!(num(maxSingle) > 0)) e.maxSingle = "Must be greater than 0.";
      if (!(num(monthly) > 0)) e.monthly = "Must be greater than 0.";
      const t = num(threshold);
      if (!Number.isInteger(t) || t < 1)
        e.threshold = "At least 1 approval required.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateStep(step)) {
      toast.error("Check the highlighted fields");
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const onCreate = async () => {
    if (!validateStep(0) || !validateStep(2)) {
      toast.error("Some details are missing", "Go back and complete them.");
      return;
    }
    setCreating(true);
    try {
      const allowedRecipients = useAllowlist
        ? Array.from(
            new Set(reviewMembers.map((m) => m.walletAddress)),
          )
        : [];
      const created = await createTreasury({
        name: name.trim(),
        description: description.trim(),
        treasuryType,
        members,
        bylaws: {
          maxSinglePayoutSol: num(maxSingle),
          monthlyBudgetSol: num(monthly),
          approvalThreshold: num(threshold),
          requireReason,
          allowNonMembersToRequest: allowNonMembers,
          allowedRecipients,
        },
      });
      toast.success("Treasury created", `${created.name} is ready.`);
      router.push("/app");
    } catch (err) {
      toast.error("Could not create treasury", (err as Error).message);
      setCreating(false);
    }
  };

  return (
    <div className="bg-cream-noise min-h-screen text-[#242424]">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-[#F4F1EA]/75 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-6">
          <Link href="/" aria-label="Bylaw home">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden gap-1.5 sm:inline-flex">
              <span className="size-1.5 rounded-full bg-success" />
              Solana {NETWORK_LABEL}
            </Badge>
            <WalletButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-6 sm:py-12">
        {/* intro */}
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-[#57534c]">
            <Sparkles className="size-3.5" /> New treasury
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Set up your treasury
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#66625C]">
            Four quick steps: identity, members, spending rules, and review.
          </p>
          <p className="mt-3 text-sm text-[#66625C]">
            Just exploring?{" "}
            <Link
              href="/app?demo=true"
              className="font-medium text-[#5b4bd6] underline underline-offset-2 hover:text-[#242424]"
            >
              Try demo mode
            </Link>{" "}
            — no wallet needed.
          </p>
        </div>

        <StepIndicator step={step} />

        <div className="mt-8 rounded-[22px] border border-black/10 bg-card p-5 shadow-[0_18px_50px_-34px_rgba(0,0,0,0.4)] sm:p-8">
          {step === 0 && (
            <StepIdentity
              name={name}
              setName={setName}
              description={description}
              setDescription={setDescription}
              treasuryType={treasuryType}
              setTreasuryType={setTreasuryType}
              error={errors.name}
            />
          )}

          {step === 1 && (
            <StepMembers
              wallet={wallet}
              members={members}
              setMembers={setMembers}
              mAddr={mAddr}
              setMAddr={setMAddr}
              mLabel={mLabel}
              setMLabel={setMLabel}
              mRole={mRole}
              setMRole={setMRole}
              addMember={addMember}
              addDemoMembers={addDemoMembers}
            />
          )}

          {step === 2 && (
            <StepRules
              maxSingle={maxSingle}
              setMaxSingle={setMaxSingle}
              monthly={monthly}
              setMonthly={setMonthly}
              threshold={threshold}
              setThreshold={setThreshold}
              requireReason={requireReason}
              setRequireReason={setRequireReason}
              allowNonMembers={allowNonMembers}
              setAllowNonMembers={setAllowNonMembers}
              useAllowlist={useAllowlist}
              setUseAllowlist={setUseAllowlist}
              errors={errors}
              templateId={templateId}
              applyTemplate={applyTemplate}
            />
          )}

          {step === 3 && (
            <StepReview
              name={name}
              treasuryType={treasuryType}
              description={description}
              reviewMembers={reviewMembers}
              maxSingle={num(maxSingle)}
              monthly={num(monthly)}
              threshold={thresholdNum}
              approverCount={approverCount}
              requireReason={requireReason}
              allowNonMembers={allowNonMembers}
              useAllowlist={useAllowlist}
              hasWallet={Boolean(wallet)}
            />
          )}
        </div>

        {/* footer nav */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <div>
            {step > 0 && (
              <Button variant="outline" onClick={back} disabled={creating}>
                <ArrowLeft className="size-4" /> Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-[#8a857d] sm:inline">
              Step {step + 1} of {STEPS.length}
            </span>
            {step < STEPS.length - 1 ? (
              <Button onClick={next}>
                Continue <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={onCreate} disabled={creating}>
                {creating ? <Spinner /> : <Rocket className="size-4" />}
                Create Treasury
              </Button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[#8a857d]">
          Saved to {mode === "supabase" ? "Supabase" : "your browser (local demo)"}.
          You can edit everything later.
        </p>
      </main>
    </div>
  );
}

/* ----------------------------- Step indicator ---------------------------- */

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center">
      {STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  done && "text-white",
                  active && "text-white ring-4 ring-[#B8B3FF]/25",
                  !done && !active && "bg-white text-[#8a857d] ring-1 ring-black/10",
                )}
                style={
                  done || active
                    ? {
                        background:
                          "linear-gradient(135deg,#FF8FA3,#B8B3FF,#9FB6FF)",
                      }
                    : undefined
                }
              >
                {done ? <Check className="size-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:block",
                  active ? "text-[#242424]" : "text-[#8a857d]",
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="mx-1 mb-5 h-0.5 flex-1 rounded-full bg-black/10 sm:mx-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: i < step ? "100%" : "0%",
                    background: "linear-gradient(90deg,#FF8FA3,#9FB6FF)",
                  }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ------------------------------- Step 1 ---------------------------------- */

function StepIdentity(props: {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  treasuryType: TreasuryType;
  setTreasuryType: (v: TreasuryType) => void;
  error?: string;
}) {
  return (
    <div>
      <StepHeading
        icon={Building2}
        title="Treasury identity"
        sub="Name it and tell us what kind of team it is."
      />
      <div className="mt-6 space-y-5">
        <div className="space-y-1.5">
          <Label>Treasury name</Label>
          <Input
            placeholder="e.g. Bylaw Foundation"
            value={props.name}
            onChange={(e) => props.setName(e.target.value)}
          />
          {props.error && (
            <p className="text-xs text-destructive">{props.error}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea
            placeholder="What is this treasury for?"
            value={props.description}
            onChange={(e) => props.setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Treasury type</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TREASURY_TYPES.map((t) => {
              const active = props.treasuryType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => props.setTreasuryType(t)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "border-transparent bg-[#242424] text-white"
                      : "border-black/10 bg-white/60 text-[#57534c] hover:bg-black/5",
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Step 2 ---------------------------------- */

function roleBadge(role: MemberRole) {
  if (role === "Admin") return <Badge variant="default">Admin</Badge>;
  if (role === "Approver") return <Badge variant="success">Approver</Badge>;
  return <Badge variant="muted">Viewer</Badge>;
}

function StepMembers(props: {
  wallet: string | null;
  members: NewMemberInput[];
  setMembers: React.Dispatch<React.SetStateAction<NewMemberInput[]>>;
  mAddr: string;
  setMAddr: (v: string) => void;
  mLabel: string;
  setMLabel: (v: string) => void;
  mRole: MemberRole;
  setMRole: (v: MemberRole) => void;
  addMember: () => void;
  addDemoMembers: () => void;
}) {
  return (
    <div>
      <StepHeading
        icon={Users}
        title="Members"
        sub="Your connected wallet becomes the first Admin. Add approvers and viewers."
      />

      {/* connected admin */}
      <div className="mt-6 rounded-xl border border-black/10 bg-white/60 p-4">
        {props.wallet ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-[#D6F2E1]">
                <Shield className="size-4 text-[#218a52]" />
              </span>
              <div>
                <p className="text-sm font-medium">You (creator)</p>
                <p className="font-mono text-xs text-[#66625C]">
                  {shortAddress(props.wallet, 6)}
                </p>
              </div>
            </div>
            {roleBadge("Admin")}
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-[#EAE6FF]">
                <Wallet className="size-4 text-[#5b4bd6]" />
              </span>
              <p className="text-sm text-[#57534c]">
                Connect a wallet to be added as the first Admin.
              </p>
            </div>
            <WalletButton />
          </div>
        )}
      </div>

      {/* add member form */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            placeholder="Wallet address"
            value={props.mAddr}
            onChange={(e) => props.setMAddr(e.target.value)}
            className="font-mono sm:col-span-2"
          />
          <Input
            placeholder="Name / label"
            value={props.mLabel}
            onChange={(e) => props.setMLabel(e.target.value)}
          />
          <Select
            value={props.mRole}
            onChange={(e) => props.setMRole(e.target.value as MemberRole)}
          >
            {MEMBER_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>
        <Button variant="outline" onClick={props.addMember} className="sm:self-start">
          <Plus className="size-4" /> Add
        </Button>
      </div>

      {/* added members */}
      <div className="mt-5">
        {props.members.length === 0 ? (
          <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-dashed border-black/15 bg-white/40 p-4 text-center sm:flex-row sm:text-left">
            <p className="text-sm text-[#66625C]">
              No extra members yet. You can skip this and add demo members.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={props.addDemoMembers}
              className="shrink-0"
            >
              <Sparkles className="size-4" /> Add demo members
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-black/10">
            {props.members.map((m, i) => (
              <div
                key={m.walletAddress}
                className="flex items-center justify-between gap-3 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.label}</p>
                  <p className="truncate font-mono text-xs text-[#66625C]">
                    {shortAddress(m.walletAddress, 6)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {roleBadge(m.role)}
                  <button
                    onClick={() =>
                      props.setMembers((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove member"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Step 3 ---------------------------------- */

function StepRules(props: {
  maxSingle: string;
  setMaxSingle: (v: string) => void;
  monthly: string;
  setMonthly: (v: string) => void;
  threshold: string;
  setThreshold: (v: string) => void;
  requireReason: boolean;
  setRequireReason: (v: boolean) => void;
  allowNonMembers: boolean;
  setAllowNonMembers: (v: boolean) => void;
  useAllowlist: boolean;
  setUseAllowlist: (v: boolean) => void;
  errors: Record<string, string>;
  templateId?: string;
  applyTemplate: (t: RuleTemplate) => void;
}) {
  return (
    <div>
      <StepHeading
        icon={Shield}
        title="Spending rules"
        sub="The policy engine checks every payout against these."
      />

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium">Start from a template</p>
        <TemplatePicker onApply={props.applyTemplate} activeId={props.templateId} />
        <p className="mt-2 text-xs text-[#8a857d]">
          Optional — you can fine-tune every value below.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Field label="Max single payout (SOL)" error={props.errors.maxSingle}>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={props.maxSingle}
            onChange={(e) => props.setMaxSingle(e.target.value)}
          />
        </Field>
        <Field label="Monthly budget (SOL)" error={props.errors.monthly}>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={props.monthly}
            onChange={(e) => props.setMonthly(e.target.value)}
          />
        </Field>
        <Field label="Approval threshold" error={props.errors.threshold}>
          <Input
            type="number"
            min={1}
            step="1"
            value={props.threshold}
            onChange={(e) => props.setThreshold(e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-5 space-y-3">
        <ToggleRow
          label="Require a reason"
          desc="Every payout must include a reason."
          checked={props.requireReason}
          onChange={props.setRequireReason}
        />
        <ToggleRow
          label="Allow non-members to request"
          desc="If off, only members can submit payout requests."
          checked={props.allowNonMembers}
          onChange={props.setAllowNonMembers}
        />
        <ToggleRow
          label="Restrict recipients (allowlist)"
          desc="Start the allowlist with your members. Add more on the Bylaws page later."
          checked={props.useAllowlist}
          onChange={props.setUseAllowlist}
        />
      </div>
    </div>
  );
}

/* ------------------------------- Step 4 ---------------------------------- */

function StepReview(props: {
  name: string;
  treasuryType: TreasuryType;
  description: string;
  reviewMembers: NewMemberInput[];
  maxSingle: number;
  monthly: number;
  threshold: number;
  approverCount: number;
  requireReason: boolean;
  allowNonMembers: boolean;
  useAllowlist: boolean;
  hasWallet: boolean;
}) {
  const warnings: string[] = [];
  if (props.threshold < 2) {
    warnings.push(
      "Approval threshold is 1 — a single wallet can release funds alone. Consider 2-of-N.",
    );
  }
  if (props.threshold > props.approverCount) {
    warnings.push(
      `Threshold (${props.threshold}) is higher than the number of approvers (${props.approverCount}). Payouts could never reach the threshold.`,
    );
  }
  if (!props.hasWallet) {
    warnings.push(
      "No wallet connected — no Admin can execute payouts until you connect one and add it as Admin.",
    );
  }

  return (
    <div>
      <StepHeading
        icon={Check}
        title="Review"
        sub="Confirm everything before creating the treasury."
      />

      <div className="mt-6 space-y-4">
        <ReviewBlock title="Treasury">
          <Row label="Name" value={props.name || "—"} />
          <Row label="Type" value={props.treasuryType} />
          {props.description && (
            <Row label="Description" value={props.description} />
          )}
        </ReviewBlock>

        <ReviewBlock title={`Members (${props.reviewMembers.length})`}>
          {props.reviewMembers.length === 0 ? (
            <p className="text-sm text-[#66625C]">No members yet.</p>
          ) : (
            <div className="space-y-2">
              {props.reviewMembers.map((m) => (
                <div
                  key={m.walletAddress}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="truncate text-sm">
                    {m.label}{" "}
                    <span className="font-mono text-xs text-[#8a857d]">
                      {shortAddress(m.walletAddress)}
                    </span>
                  </span>
                  {roleBadge(m.role)}
                </div>
              ))}
            </div>
          )}
        </ReviewBlock>

        <ReviewBlock title="Rules">
          <Row label="Max single payout" value={`${props.maxSingle} SOL`} />
          <Row label="Monthly budget" value={`${props.monthly} SOL`} />
          <Row
            label="Approval threshold"
            value={`${props.threshold} of ${props.approverCount || "—"}`}
          />
          <Row label="Reason required" value={props.requireReason ? "Yes" : "No"} />
          <Row
            label="Non-members can request"
            value={props.allowNonMembers ? "Yes" : "No"}
          />
          <Row
            label="Recipient allowlist"
            value={props.useAllowlist ? "On (members)" : "Open"}
          />
        </ReviewBlock>

        {warnings.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-amber-700">
              <CircleAlert className="size-4" /> Before you create
            </p>
            <ul className="mt-2 space-y-1.5">
              {warnings.map((w) => (
                <li key={w} className="text-sm text-amber-800/90">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- helpers --------------------------------- */

function StepHeading({
  icon: Icon,
  title,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFD6DC] via-[#EAE6FF] to-[#DCE6FF]">
        <Icon className="size-5 text-[#242424]" />
      </span>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-0.5 text-sm text-[#66625C]">{sub}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-black/10 bg-white/60 p-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-[#66625C]">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ReviewBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-white/60 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#8a857d]">
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] py-1.5 last:border-0">
      <span className="text-sm text-[#66625C]">{label}</span>
      <span className="max-w-[60%] truncate text-right text-sm font-medium">
        {value}
      </span>
    </div>
  );
}
