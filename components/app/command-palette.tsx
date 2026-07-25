"use client";

import * as React from "react";
import {
  Download,
  FileText,
  FlaskConical,
  Gavel,
  LayoutDashboard,
  Plus,
  ScrollText,
  Search,
  Send,
  Settings,
  Users,
} from "lucide-react";
import { SHORTCUTS, Shortcut } from "@/lib/shortcuts";
import { Kbd } from "@/components/app/kbd";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "go-dashboard": LayoutDashboard,
  "go-payouts": Send,
  "go-bylaws": Gavel,
  "go-members": Users,
  "go-audit": ScrollText,
  "go-settings": Settings,
  "go-simulator": FlaskConical,
  "new-payout": Plus,
  "new-treasury": FileText,
  "export-audit": Download,
};

export function CommandPalette({
  open,
  onClose,
  onRun,
}: {
  open: boolean;
  onClose: () => void;
  onRun: (id: string) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Command palette lists everything except itself.
  const commands = React.useMemo(
    () => SHORTCUTS.filter((s) => s.id !== "command-palette"),
    [],
  );

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q),
    );
  }, [commands, query]);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  React.useEffect(() => setActive(0), [query]);

  if (!open) return null;

  const run = (s: Shortcut) => {
    onRun(s.id);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const s = results[active];
      if (s) run(s);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="size-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <Kbd>Esc</Kbd>
        </div>
        <div className="max-h-[320px] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No commands match “{query}”.
            </p>
          ) : (
            results.map((s, i) => {
              const Icon = ICONS[s.id] ?? Search;
              return (
                <button
                  key={s.id}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => run(s)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left",
                    i === active ? "bg-accent" : "hover:bg-accent/60",
                  )}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                    <Icon className="size-4 text-muted-foreground" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {s.label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {s.description}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {s.keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
