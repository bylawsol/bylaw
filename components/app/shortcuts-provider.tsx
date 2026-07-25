"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { CommandPalette } from "@/components/app/command-palette";
import { ShortcutHelp } from "@/components/app/shortcut-help";
import { useTreasury } from "@/components/treasury-provider";
import { useToast } from "@/components/ui/toast";
import { SHORTCUTS } from "@/lib/shortcuts";

interface ShortcutsContextValue {
  openPalette: () => void;
  openHelp: () => void;
}

const ShortcutsContext = React.createContext<ShortcutsContextValue | null>(null);

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const { treasury } = useTreasury();
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);

  const exportAudit = React.useCallback(() => {
    if (!treasury) {
      toast.error("No treasury", "Nothing to export yet.");
      return;
    }
    const blob = new Blob([JSON.stringify(treasury.auditEvents, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bylaw-audit-${treasury.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported");
  }, [treasury, toast]);

  const runShortcut = React.useCallback(
    (id: string) => {
      if (id === "command-palette") return setPaletteOpen(true);
      if (id === "shortcut-help") return setHelpOpen(true);
      if (id === "export-audit") return exportAudit();
      const s = SHORTCUTS.find((x) => x.id === id);
      if (s?.href) router.push(s.href);
    },
    [router, exportAudit],
  );

  useKeyboardShortcuts({
    enabled: !paletteOpen && !helpOpen,
    onShortcut: runShortcut,
  });

  const value = React.useMemo<ShortcutsContextValue>(
    () => ({
      openPalette: () => setPaletteOpen(true),
      openHelp: () => setHelpOpen(true),
    }),
    [],
  );

  return (
    <ShortcutsContext.Provider value={value}>
      {children}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onRun={runShortcut}
      />
      <ShortcutHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </ShortcutsContext.Provider>
  );
}

export function useShortcuts(): ShortcutsContextValue {
  const ctx = React.useContext(ShortcutsContext);
  if (!ctx)
    throw new Error("useShortcuts must be used within ShortcutsProvider");
  return ctx;
}
