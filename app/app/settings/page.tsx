"use client";

import * as React from "react";
import {
  Database,
  Download,
  HardDrive,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useTreasury } from "@/components/treasury-provider";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Treasury } from "@/lib/types";
import { NETWORK_LABEL_LOWER } from "@/lib/network";

export default function SettingsPage() {
  const {
    treasury,
    loading,
    mode,
    updateTreasuryMeta,
    reseedDemo,
    clearDemoData,
    importTreasury,
  } = useTreasury();
  const toast = useToast();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [clearOpen, setClearOpen] = React.useState(false);
  const [reseedOpen, setReseedOpen] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (treasury) {
      setName(treasury.name);
      setDescription(treasury.description);
    }
  }, [treasury]);

  if (loading || !treasury) return <PageSkeleton />;

  const onSave = async () => {
    if (!name.trim()) {
      toast.error("Name required");
      return;
    }
    setSaving(true);
    try {
      await updateTreasuryMeta({
        name: name.trim(),
        description: description.trim(),
      });
      toast.success("Treasury updated");
    } finally {
      setSaving(false);
    }
  };

  const exportTreasury = () => {
    const blob = new Blob([JSON.stringify(treasury, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bylaw-treasury-${treasury.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Treasury exported");
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Treasury;
      if (!parsed.id || !parsed.name || !Array.isArray(parsed.payouts)) {
        throw new Error("File is not a valid Bylaw treasury export.");
      }
      await importTreasury(parsed);
      toast.success("Treasury imported", parsed.name);
    } catch (err) {
      toast.error("Import failed", (err as Error).message);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Treasury details, storage mode, and demo data."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Treasury details</CardTitle>
              <CardDescription>Rename or edit the description.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <Button onClick={onSave} disabled={saving}>
                {saving ? <Spinner /> : <Save className="size-4" />} Save changes
              </Button>
            </CardContent>
          </Card>

          {/* Data */}
          <Card>
            <CardHeader>
              <CardTitle>Data</CardTitle>
              <CardDescription>
                Export or import this treasury as JSON.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={exportTreasury}>
                <Download className="size-4" /> Export treasury JSON
              </Button>
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="size-4" /> Import treasury JSON
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={onImportFile}
              />
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">Danger zone</CardTitle>
              <CardDescription>
                Demo data lives in your browser (localStorage). These actions
                only affect local demo data.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setReseedOpen(true)}>
                <RefreshCw className="size-4" /> Reseed demo treasury
              </Button>
              <Button variant="destructive" onClick={() => setClearOpen(true)}>
                <Trash2 className="size-4" /> Clear local demo data
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Storage mode */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Storage mode</CardTitle>
              <CardDescription>
                Bylaw uses Supabase when its env vars are set, otherwise local
                demo storage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                {mode === "supabase" ? (
                  <Database className="size-5" />
                ) : (
                  <HardDrive className="size-5" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {mode === "supabase" ? "Supabase" : "Local Demo"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {mode === "supabase"
                      ? "Persisted to your Supabase project."
                      : "Persisted in this browser only."}
                  </p>
                </div>
                <Badge
                  variant={mode === "supabase" ? "success" : "muted"}
                  className="ml-auto"
                >
                  Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                To switch to Supabase, set{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono">
                  NEXT_PUBLIC_SUPABASE_URL
                </code>{" "}
                and{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono">
                  NEXT_PUBLIC_SUPABASE_ANON_KEY
                </code>{" "}
                and reload. This is informational — the toggle is driven by
                environment variables, not a switch.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        title="Clear local demo data?"
        description={`This permanently removes all treasuries stored in this browser. Executed ${NETWORK_LABEL_LOWER} transactions on-chain are not affected.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setClearOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await clearDemoData();
                setClearOpen(false);
                toast.success("Local data cleared", "Redirecting to setup…");
              }}
            >
              Clear everything
            </Button>
          </>
        }
      />

      <Modal
        open={reseedOpen}
        onClose={() => setReseedOpen(false)}
        title="Reseed demo treasury?"
        description="This creates a fresh Bylaw Foundation sample treasury with your connected wallet as Admin. Existing treasuries remain."
        footer={
          <>
            <Button variant="outline" onClick={() => setReseedOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await reseedDemo();
                setReseedOpen(false);
                toast.success("Demo treasury reseeded");
              }}
            >
              Reseed
            </Button>
          </>
        }
      />
    </div>
  );
}
