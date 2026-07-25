// Storage abstraction. The UI never cares which backend is active.
// - If Supabase env vars are present, use Supabase (normalized tables).
// - Otherwise, fall back to localStorage ("Local" mode).

import { getSupabase, supabaseConfigured } from "./supabaseClient";
import {
  Approval,
  AuditEvent,
  Bylaws,
  Member,
  Payout,
  Treasury,
} from "./types";

export type StorageMode = "supabase" | "local";

export function storageMode(): StorageMode {
  return supabaseConfigured ? "supabase" : "local";
}

const LS_KEY = "bylaw:v1";

interface LocalDb {
  activeTreasuryId: string | null;
  treasuries: Record<string, Treasury>;
}

function readLocal(): LocalDb {
  if (typeof window === "undefined") {
    return { activeTreasuryId: null, treasuries: {} };
  }
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return { activeTreasuryId: null, treasuries: {} };
    const parsed = JSON.parse(raw) as LocalDb;
    return {
      activeTreasuryId: parsed.activeTreasuryId ?? null,
      treasuries: parsed.treasuries ?? {},
    };
  } catch {
    return { activeTreasuryId: null, treasuries: {} };
  }
}

function writeLocal(db: LocalDb) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(db));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getTreasuries(): Promise<Treasury[]> {
  if (storageMode() === "supabase") return supabaseGetTreasuries();
  const db = readLocal();
  return Object.values(db.treasuries).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export async function getTreasury(id: string): Promise<Treasury | null> {
  if (storageMode() === "supabase") return supabaseGetTreasury(id);
  const db = readLocal();
  return db.treasuries[id] ?? null;
}

/** Find a payout (and its treasury) by payout id — used by public receipts. */
export async function findPayoutById(
  payoutId: string,
): Promise<{ treasury: Treasury; payout: Payout } | null> {
  if (storageMode() === "supabase") {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb
      .from("payouts")
      .select("treasury_id")
      .eq("id", payoutId)
      .maybeSingle();
    if (!data) return null;
    const treasury = await supabaseGetTreasury(data.treasury_id);
    const payout = treasury?.payouts.find((p) => p.id === payoutId);
    return treasury && payout ? { treasury, payout } : null;
  }
  const db = readLocal();
  for (const treasury of Object.values(db.treasuries)) {
    const payout = treasury.payouts.find((p) => p.id === payoutId);
    if (payout) return { treasury, payout };
  }
  return null;
}

export async function getActiveTreasuryId(): Promise<string | null> {
  if (storageMode() === "supabase") {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("bylaw:activeTreasury");
  }
  return readLocal().activeTreasuryId;
}

export async function setActiveTreasuryId(id: string | null): Promise<void> {
  if (storageMode() === "supabase") {
    if (typeof window === "undefined") return;
    if (id) window.localStorage.setItem("bylaw:activeTreasury", id);
    else window.localStorage.removeItem("bylaw:activeTreasury");
    return;
  }
  const db = readLocal();
  db.activeTreasuryId = id;
  writeLocal(db);
}

export async function saveTreasury(treasury: Treasury): Promise<void> {
  if (storageMode() === "supabase") return supabaseSaveTreasury(treasury);
  const db = readLocal();
  db.treasuries[treasury.id] = treasury;
  if (!db.activeTreasuryId) db.activeTreasuryId = treasury.id;
  writeLocal(db);
}

export async function deleteTreasury(id: string): Promise<void> {
  if (storageMode() === "supabase") {
    await supabaseDeleteTreasury(id);
    return;
  }
  const db = readLocal();
  delete db.treasuries[id];
  if (db.activeTreasuryId === id) {
    db.activeTreasuryId = Object.keys(db.treasuries)[0] ?? null;
  }
  writeLocal(db);
}

export async function clearAllLocal(): Promise<void> {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LS_KEY);
  window.localStorage.removeItem("bylaw:activeTreasury");
}

// ---------------------------------------------------------------------------
// Supabase adapter (normalized tables, "replace" semantics on save)
// ---------------------------------------------------------------------------

async function supabaseGetTreasuries(): Promise<Treasury[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from("treasuries").select("id");
  if (error || !data) return [];
  const results = await Promise.all(
    data.map((row: { id: string }) => supabaseGetTreasury(row.id)),
  );
  return results.filter((t): t is Treasury => t !== null);
}

async function supabaseGetTreasury(id: string): Promise<Treasury | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data: t, error } = await sb
    .from("treasuries")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !t) return null;

  const [bylawsRes, membersRes, payoutsRes, approvalsRes, auditRes] =
    await Promise.all([
      sb.from("bylaws").select("*").eq("treasury_id", id).maybeSingle(),
      sb.from("treasury_members").select("*").eq("treasury_id", id),
      sb.from("payouts").select("*").eq("treasury_id", id),
      sb.from("payout_approvals").select("*").eq("treasury_id", id),
      sb.from("audit_events").select("*").eq("treasury_id", id),
    ]);

  const bylaws: Bylaws = bylawsRes.data
    ? {
        maxSinglePayoutSol: Number(bylawsRes.data.max_single_payout_sol),
        approvalThreshold: Number(bylawsRes.data.approval_threshold),
        monthlyBudgetSol: Number(bylawsRes.data.monthly_budget_sol),
        allowedRecipients: bylawsRes.data.allowed_recipients ?? [],
        requireReason: Boolean(bylawsRes.data.require_reason),
        allowNonMembersToRequest: Boolean(
          bylawsRes.data.allow_non_members_to_request,
        ),
      }
    : {
        maxSinglePayoutSol: 0,
        approvalThreshold: 1,
        monthlyBudgetSol: 0,
        allowedRecipients: [],
        requireReason: true,
        allowNonMembersToRequest: false,
      };

  const members: Member[] = (membersRes.data ?? []).map((m: any) => ({
    id: m.id,
    walletAddress: m.wallet_address,
    label: m.label,
    role: m.role,
    addedAt: m.added_at,
  }));

  const approvalsByPayout = new Map<string, Approval[]>();
  for (const a of approvalsRes.data ?? []) {
    const list = approvalsByPayout.get(a.payout_id) ?? [];
    list.push({
      signerAddress: a.signer_address,
      signature: a.signature,
      message: a.message,
      signedAt: a.signed_at,
    });
    approvalsByPayout.set(a.payout_id, list);
  }

  const payouts: Payout[] = (payoutsRes.data ?? []).map((p: any) => ({
    id: p.id,
    recipient: p.recipient,
    amountSol: Number(p.amount_sol),
    category: p.category,
    reason: p.reason ?? "",
    note: p.note ?? undefined,
    requester: p.requester,
    status: p.status,
    policyPassed: Boolean(p.policy_passed),
    policyReasons: p.policy_reasons ?? [],
    approvals: approvalsByPayout.get(p.id) ?? [],
    rejection: p.rejection ?? undefined,
    txSignature: p.tx_signature ?? undefined,
    createdAt: p.created_at,
    executedAt: p.executed_at ?? undefined,
  }));

  const auditEvents: AuditEvent[] = (auditRes.data ?? []).map((e: any) => ({
    id: e.id,
    type: e.type,
    actor: e.actor,
    detail: e.detail,
    meta: e.meta ?? undefined,
    createdAt: e.created_at,
  }));

  return {
    id: t.id,
    name: t.name,
    description: t.description ?? "",
    treasuryWalletAddress: t.treasury_wallet_address ?? "",
    createdByWallet: t.created_by_wallet ?? "",
    createdAt: t.created_at,
    bylaws,
    members,
    payouts: payouts.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    ),
    auditEvents: auditEvents.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    ),
  };
}

async function supabaseSaveTreasury(t: Treasury): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  await sb.from("treasuries").upsert({
    id: t.id,
    name: t.name,
    description: t.description,
    treasury_wallet_address: t.treasuryWalletAddress,
    created_by_wallet: t.createdByWallet,
    created_at: t.createdAt,
  });

  await sb.from("bylaws").upsert({
    treasury_id: t.id,
    max_single_payout_sol: t.bylaws.maxSinglePayoutSol,
    approval_threshold: t.bylaws.approvalThreshold,
    monthly_budget_sol: t.bylaws.monthlyBudgetSol,
    allowed_recipients: t.bylaws.allowedRecipients,
    require_reason: t.bylaws.requireReason,
    allow_non_members_to_request: t.bylaws.allowNonMembersToRequest,
  });

  // Replace child collections.
  await Promise.all([
    sb.from("treasury_members").delete().eq("treasury_id", t.id),
    sb.from("payout_approvals").delete().eq("treasury_id", t.id),
    sb.from("payouts").delete().eq("treasury_id", t.id),
    sb.from("audit_events").delete().eq("treasury_id", t.id),
  ]);

  if (t.members.length) {
    await sb.from("treasury_members").insert(
      t.members.map((m) => ({
        id: m.id,
        treasury_id: t.id,
        wallet_address: m.walletAddress,
        label: m.label,
        role: m.role,
        added_at: m.addedAt,
      })),
    );
  }

  if (t.payouts.length) {
    await sb.from("payouts").insert(
      t.payouts.map((p) => ({
        id: p.id,
        treasury_id: t.id,
        recipient: p.recipient,
        amount_sol: p.amountSol,
        category: p.category,
        reason: p.reason,
        note: p.note ?? null,
        requester: p.requester,
        status: p.status,
        policy_passed: p.policyPassed,
        policy_reasons: p.policyReasons,
        rejection: p.rejection ?? null,
        tx_signature: p.txSignature ?? null,
        created_at: p.createdAt,
        executed_at: p.executedAt ?? null,
      })),
    );

    const approvals = t.payouts.flatMap((p) =>
      p.approvals.map((a) => ({
        treasury_id: t.id,
        payout_id: p.id,
        signer_address: a.signerAddress,
        signature: a.signature,
        message: a.message,
        signed_at: a.signedAt,
      })),
    );
    if (approvals.length) await sb.from("payout_approvals").insert(approvals);
  }

  if (t.auditEvents.length) {
    await sb.from("audit_events").insert(
      t.auditEvents.map((e) => ({
        id: e.id,
        treasury_id: t.id,
        type: e.type,
        actor: e.actor,
        detail: e.detail,
        meta: e.meta ?? null,
        created_at: e.createdAt,
      })),
    );
  }
}

async function supabaseDeleteTreasury(id: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await Promise.all([
    sb.from("treasury_members").delete().eq("treasury_id", id),
    sb.from("payout_approvals").delete().eq("treasury_id", id),
    sb.from("payouts").delete().eq("treasury_id", id),
    sb.from("audit_events").delete().eq("treasury_id", id),
    sb.from("bylaws").delete().eq("treasury_id", id),
  ]);
  await sb.from("treasuries").delete().eq("id", id);
}
