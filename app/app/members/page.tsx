"use client";

import * as React from "react";
import { Shield, Trash2, UserPlus, Users } from "lucide-react";
import { useTreasury } from "@/components/treasury-provider";
import { useToast } from "@/components/ui/toast";
import {
  CopyButton,
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
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { MEMBER_ROLES, MemberRole } from "@/lib/types";
import { isValidSolanaAddress, shortAddress } from "@/lib/utils";

function roleBadge(role: MemberRole) {
  if (role === "Admin") return <Badge variant="default">Admin</Badge>;
  if (role === "Approver") return <Badge variant="success">Approver</Badge>;
  return <Badge variant="muted">Viewer</Badge>;
}

export default function MembersPage() {
  const { treasury, loading, wallet, addMember, removeMember } = useTreasury();
  const toast = useToast();

  const [address, setAddress] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [role, setRole] = React.useState<MemberRole>("Approver");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [removing, setRemoving] = React.useState<string | null>(null);

  if (loading || !treasury) return <PageSkeleton />;

  const onAdd = async () => {
    const addr = address.trim();
    if (!isValidSolanaAddress(addr)) {
      setError("Enter a valid Solana wallet address.");
      return;
    }
    if (
      treasury.members.some(
        (m) => m.walletAddress.toLowerCase() === addr.toLowerCase(),
      )
    ) {
      setError("This wallet is already a member.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await addMember({ walletAddress: addr, label: label.trim() || "Member", role });
      toast.success("Member added", shortAddress(addr));
      setAddress("");
      setLabel("");
      setRole("Approver");
    } catch (e) {
      toast.error("Could not add member", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    const m = treasury.members.find((x) => x.id === removing);
    try {
      await removeMember(removing);
      toast.success("Member removed", m ? shortAddress(m.walletAddress) : undefined);
    } catch (e) {
      toast.error("Could not remove member", (e as Error).message);
    } finally {
      setRemoving(null);
    }
  };

  const adminCount = treasury.members.filter((m) => m.role === "Admin").length;

  return (
    <div>
      <PageHeader
        title="Members"
        description="Treasury members and their roles. Admins can execute payouts; Approvers and Admins can sign approvals."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Add member */}
        <Card className="lg:order-2">
          <CardHeader>
            <CardTitle>Add member</CardTitle>
            <CardDescription>Add a wallet by address and role.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Wallet address</Label>
              <Input
                placeholder="Solana wallet address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Name / label</Label>
              <Input
                placeholder="e.g. Core contributor"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value as MemberRole)}
              >
                {MEMBER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button onClick={onAdd} disabled={busy} className="w-full">
              {busy ? <Spinner /> : <UserPlus className="size-4" />} Add member
            </Button>
            {wallet &&
              !treasury.members.some(
                (m) => m.walletAddress.toLowerCase() === wallet.toLowerCase(),
              ) && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setAddress(wallet)}
                >
                  Use my connected wallet
                </Button>
              )}
          </CardContent>
        </Card>

        {/* Member list */}
        <div className="lg:order-1 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4" /> {treasury.members.length} member
                {treasury.members.length === 1 ? "" : "s"}
              </CardTitle>
              <Badge variant="outline">{adminCount} admin{adminCount === 1 ? "" : "s"}</Badge>
            </CardHeader>
            <CardContent>
              {treasury.members.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No members yet"
                  description="Connect a wallet to be added as the first Admin, or add one manually."
                />
              ) : (
                <div className="divide-y divide-border">
                  {treasury.members.map((m) => {
                    const isYou =
                      wallet &&
                      m.walletAddress.toLowerCase() === wallet.toLowerCase();
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-3 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-full border border-border">
                            <Shield className="size-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-medium">
                                {m.label}
                              </p>
                              {isYou && (
                                <Badge variant="outline" className="text-[10px]">
                                  You
                                </Badge>
                              )}
                            </div>
                            <p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                              {shortAddress(m.walletAddress, 6)}
                              <CopyButton value={m.walletAddress} />
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {roleBadge(m.role)}
                          <button
                            onClick={() => setRemoving(m.id)}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Remove member"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove member"
        description="This wallet will lose its role. This action is recorded in the audit log."
        footer={
          <>
            <Button variant="outline" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemove}>
              Remove
            </Button>
          </>
        }
      />
    </div>
  );
}
