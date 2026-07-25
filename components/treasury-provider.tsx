"use client";

import * as React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  AuditEvent,
  AuditEventType,
  Bylaws,
  Member,
  MemberRole,
  Payout,
  PayoutCategory,
  Treasury,
  TreasuryType,
} from "@/lib/types";
import {
  getActiveTreasuryId,
  getTreasuries,
  saveTreasury,
  setActiveTreasuryId,
  storageMode,
  StorageMode,
  clearAllLocal,
} from "@/lib/storage";
import { evaluatePolicy, PolicyResult } from "@/lib/policy";
import { uid } from "@/lib/utils";
import { NETWORK_LABEL_LOWER } from "@/lib/network";

interface CreatePayoutInput {
  recipient: string;
  amountSol: number;
  category: PayoutCategory;
  reason: string;
  note?: string;
}

export interface NewMemberInput {
  walletAddress: string;
  label: string;
  role: MemberRole;
}

export interface CreateTreasuryInput {
  name: string;
  description: string;
  treasuryType: TreasuryType;
  members: NewMemberInput[];
  bylaws: Bylaws;
}

interface TreasuryContextValue {
  treasury: Treasury | null;
  treasuries: Treasury[];
  loading: boolean;
  mode: StorageMode;
  wallet: string | null;
  refresh: () => Promise<void>;
  selectTreasury: (id: string) => Promise<void>;

  updateBylaws: (bylaws: Bylaws) => Promise<void>;
  addMember: (m: Omit<Member, "id" | "addedAt">) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  createPayout: (input: CreatePayoutInput) => Promise<{ payout: Payout; policy: PolicyResult }>;
  addApproval: (
    payoutId: string,
    approval: { signerAddress: string; signature: string; message: string },
  ) => Promise<void>;
  rejectPayout: (payoutId: string, reason: string) => Promise<void>;
  markExecuted: (payoutId: string, txSignature: string) => Promise<void>;
  updateTreasuryMeta: (patch: { name?: string; description?: string }) => Promise<void>;

  createTreasury: (input: CreateTreasuryInput) => Promise<Treasury>;
  clearAllData: () => Promise<void>;
  importTreasury: (t: Treasury) => Promise<void>;
}

const TreasuryContext = React.createContext<TreasuryContextValue | null>(null);

function makeEvent(
  type: AuditEventType,
  actor: string,
  detail: string,
  meta?: Record<string, unknown>,
): AuditEvent {
  return {
    id: uid("ev_"),
    type,
    actor: actor || "system",
    detail,
    meta,
    createdAt: new Date().toISOString(),
  };
}

export function TreasuryProvider({ children }: { children: React.ReactNode }) {
  const { publicKey } = useWallet();
  const wallet = publicKey ? publicKey.toBase58() : null;

  const [treasuries, setTreasuries] = React.useState<Treasury[]>([]);
  const [treasury, setTreasury] = React.useState<Treasury | null>(null);
  const [loading, setLoading] = React.useState(true);
  const mode = storageMode();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      // No auto-seed: a first-time user (no treasuries) is routed to the
      // /app/setup wizard to create their first treasury.
      const all = await getTreasuries();

      setTreasuries(all);

      if (all.length > 0) {
        const activeId = await getActiveTreasuryId();
        const active =
          all.find((t) => t.id === activeId) ?? all[0];
        await setActiveTreasuryId(active.id);
        setTreasury(active);
      } else {
        setTreasury(null);
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  React.useEffect(() => {
    load();
  }, [load]);

  // When a wallet connects and the active treasury has no members yet,
  // add the connected wallet as the first Admin.
  React.useEffect(() => {
    if (!wallet || !treasury) return;
    if (treasury.members.length === 0) {
      const next: Treasury = {
        ...treasury,
        createdByWallet: treasury.createdByWallet || wallet,
        treasuryWalletAddress: treasury.treasuryWalletAddress || wallet,
        members: [
          {
            id: uid("mb_"),
            walletAddress: wallet,
            label: "You (creator)",
            role: "Admin",
            addedAt: new Date().toISOString(),
          },
        ],
        auditEvents: [
          ...treasury.auditEvents,
          makeEvent(
            "member_added",
            wallet,
            "Connected wallet added as first Admin",
            { walletAddress: wallet, role: "Admin" },
          ),
        ],
      };
      persist(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, treasury?.id, treasury?.members.length]);

  const persist = React.useCallback(async (next: Treasury) => {
    setTreasury(next);
    setTreasuries((prev) => {
      const exists = prev.some((t) => t.id === next.id);
      return exists
        ? prev.map((t) => (t.id === next.id ? next : t))
        : [...prev, next];
    });
    await saveTreasury(next);
  }, []);

  const requireTreasury = (): Treasury => {
    if (!treasury) throw new Error("No active treasury");
    return treasury;
  };

  const value = React.useMemo<TreasuryContextValue>(() => {
    return {
      treasury,
      treasuries,
      loading,
      mode,
      wallet,
      refresh: load,

      selectTreasury: async (id) => {
        const t = treasuries.find((x) => x.id === id);
        if (t) {
          await setActiveTreasuryId(id);
          setTreasury(t);
        }
      },

      updateBylaws: async (bylaws) => {
        const t = requireTreasury();
        const next: Treasury = {
          ...t,
          bylaws,
          auditEvents: [
            ...t.auditEvents,
            makeEvent("bylaws_updated", wallet || "system", "Bylaws updated", {
              bylaws,
            }),
          ],
        };
        await persist(next);
      },

      addMember: async (m) => {
        const t = requireTreasury();
        const member: Member = {
          ...m,
          id: uid("mb_"),
          addedAt: new Date().toISOString(),
        };
        const next: Treasury = {
          ...t,
          members: [...t.members, member],
          auditEvents: [
            ...t.auditEvents,
            makeEvent(
              "member_added",
              wallet || "system",
              `Member added: ${member.label || member.walletAddress} (${member.role})`,
              { walletAddress: member.walletAddress, role: member.role },
            ),
          ],
        };
        await persist(next);
      },

      removeMember: async (memberId) => {
        const t = requireTreasury();
        const removed = t.members.find((m) => m.id === memberId);
        const next: Treasury = {
          ...t,
          members: t.members.filter((m) => m.id !== memberId),
          auditEvents: [
            ...t.auditEvents,
            makeEvent(
              "member_removed",
              wallet || "system",
              `Member removed: ${removed?.label || removed?.walletAddress || memberId}`,
              { walletAddress: removed?.walletAddress },
            ),
          ],
        };
        await persist(next);
      },

      createPayout: async (input) => {
        const t = requireTreasury();
        const requester = wallet || "unknown";
        const policy = evaluatePolicy(t, {
          recipient: input.recipient,
          amountSol: input.amountSol,
          reason: input.reason,
          requester,
        });
        const now = new Date().toISOString();
        const payout: Payout = {
          id: uid("po_"),
          recipient: input.recipient,
          amountSol: input.amountSol,
          category: input.category,
          reason: input.reason,
          note: input.note,
          requester,
          status: policy.passed ? "Pending Approval" : "Policy Blocked",
          policyPassed: policy.passed,
          policyReasons: policy.reasons,
          approvals: [],
          createdAt: now,
        };
        const events: AuditEvent[] = [
          makeEvent(
            "payout_created",
            requester,
            `Payout created: ${input.amountSol} SOL (${input.category})`,
            { payoutId: payout.id },
          ),
          policy.passed
            ? makeEvent(
                "payout_policy_passed",
                "system",
                `Policy passed for ${input.amountSol} SOL payout`,
                { payoutId: payout.id },
              )
            : makeEvent(
                "payout_policy_blocked",
                "system",
                `Policy blocked: ${policy.checks
                  .filter((c) => !c.passed)
                  .map((c) => c.label)
                  .join(", ")}`,
                { payoutId: payout.id, reasons: policy.reasons },
              ),
        ];
        const next: Treasury = {
          ...t,
          payouts: [...t.payouts, payout],
          auditEvents: [...t.auditEvents, ...events],
        };
        await persist(next);
        return { payout, policy };
      },

      addApproval: async (payoutId, approval) => {
        const t = requireTreasury();
        const next: Treasury = {
          ...t,
          payouts: t.payouts.map((p) =>
            p.id === payoutId
              ? {
                  ...p,
                  approvals: [
                    ...p.approvals,
                    { ...approval, signedAt: new Date().toISOString() },
                  ],
                }
              : p,
          ),
          auditEvents: [
            ...t.auditEvents,
            makeEvent(
              "payout_approved",
              approval.signerAddress,
              `Payout ${payoutId} approved (wallet-signed)`,
              { payoutId, signer: approval.signerAddress },
            ),
          ],
        };
        await persist(next);
      },

      rejectPayout: async (payoutId, reason) => {
        const t = requireTreasury();
        const rejActor = wallet || "unknown";
        const next: Treasury = {
          ...t,
          payouts: t.payouts.map((p) =>
            p.id === payoutId
              ? {
                  ...p,
                  status: "Rejected" as const,
                  rejection: {
                    rejectedBy: rejActor,
                    reason,
                    rejectedAt: new Date().toISOString(),
                  },
                }
              : p,
          ),
          auditEvents: [
            ...t.auditEvents,
            makeEvent(
              "payout_rejected",
              rejActor,
              `Payout ${payoutId} rejected: ${reason}`,
              { payoutId, reason },
            ),
          ],
        };
        await persist(next);
      },

      markExecuted: async (payoutId, txSignature) => {
        const t = requireTreasury();
        const payout = t.payouts.find((p) => p.id === payoutId);
        const next: Treasury = {
          ...t,
          payouts: t.payouts.map((p) =>
            p.id === payoutId
              ? {
                  ...p,
                  status: "Executed" as const,
                  txSignature,
                  executedAt: new Date().toISOString(),
                }
              : p,
          ),
          auditEvents: [
            ...t.auditEvents,
            makeEvent(
              "payout_executed",
              wallet || "system",
              `Payout executed: ${payout?.amountSol ?? ""} SOL on ${NETWORK_LABEL_LOWER}`,
              { payoutId, txSignature },
            ),
          ],
        };
        await persist(next);
      },

      updateTreasuryMeta: async (patch) => {
        const t = requireTreasury();
        const next: Treasury = { ...t, ...patch };
        await persist(next);
      },

      createTreasury: async (input) => {
        const now = new Date().toISOString();
        const admin = wallet || "";
        const members: Member[] = [];

        // Connected wallet becomes the first Admin automatically.
        if (admin) {
          members.push({
            id: uid("mb_"),
            walletAddress: admin,
            label: "You (creator)",
            role: "Admin",
            addedAt: now,
          });
        }
        // Additional members, skipping duplicates and the admin wallet.
        for (const m of input.members) {
          const dup = members.some(
            (x) => x.walletAddress.toLowerCase() === m.walletAddress.toLowerCase(),
          );
          if (dup) continue;
          members.push({
            id: uid("mb_"),
            walletAddress: m.walletAddress,
            label: m.label || "Member",
            role: m.role,
            addedAt: now,
          });
        }

        const auditEvents: AuditEvent[] = [
          makeEvent(
            "treasury_created",
            admin || "system",
            `Treasury “${input.name}” created`,
            { treasuryType: input.treasuryType },
          ),
          ...members.map((m) =>
            makeEvent(
              "member_added",
              admin || "system",
              `Member added: ${m.label} (${m.role})`,
              { walletAddress: m.walletAddress, role: m.role },
            ),
          ),
          makeEvent("bylaws_updated", admin || "system", "Initial bylaws set", {
            bylaws: input.bylaws,
          }),
        ];

        const created: Treasury = {
          id: uid("tr_"),
          name: input.name,
          description: input.description,
          treasuryType: input.treasuryType,
          treasuryWalletAddress: admin,
          createdByWallet: admin || "system",
          createdAt: now,
          bylaws: input.bylaws,
          members,
          payouts: [],
          auditEvents,
        };

        await saveTreasury(created);
        await setActiveTreasuryId(created.id);
        await load();
        return created;
      },

      clearAllData: async () => {
        await clearAllLocal();
        setTreasury(null);
        setTreasuries([]);
        await load();
      },

      importTreasury: async (imported) => {
        await saveTreasury(imported);
        await setActiveTreasuryId(imported.id);
        await load();
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treasury, treasuries, loading, mode, wallet, persist, load]);

  return (
    <TreasuryContext.Provider value={value}>
      {children}
    </TreasuryContext.Provider>
  );
}

export function useTreasury(): TreasuryContextValue {
  const ctx = React.useContext(TreasuryContext);
  if (!ctx)
    throw new Error("useTreasury must be used within TreasuryProvider");
  return ctx;
}
