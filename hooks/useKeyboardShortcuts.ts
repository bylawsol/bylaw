import * as React from "react";
import { SEQUENCE_MAP, SOLO_MAP } from "@/lib/shortcuts";

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable === true
  );
}

/**
 * Global keyboard shortcut handler with sequence support (e.g. "G" then "D").
 * Never fires while the user is typing in a field. Cmd/Ctrl+K always opens the
 * palette; "?" opens help. All other shortcuts are gated by `enabled`.
 */
export function useKeyboardShortcuts({
  enabled,
  onShortcut,
}: {
  enabled: boolean;
  onShortcut: (id: string) => void;
}) {
  const pending = React.useRef<string | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const handler = React.useRef(onShortcut);
  handler.current = onShortcut;

  React.useEffect(() => {
    const clearPending = () => {
      pending.current = null;
      if (timer.current) clearTimeout(timer.current);
    };

    const onKey = (e: KeyboardEvent) => {
      // Command palette works everywhere, even mid-typing.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handler.current("command-palette");
        return;
      }
      if (!enabled) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(e.target)) return;

      if (e.key === "?") {
        e.preventDefault();
        handler.current("shortcut-help");
        return;
      }

      const lower = e.key.toLowerCase();
      if (!/^[a-z]$/.test(lower)) return;

      if (pending.current) {
        const combo = pending.current + lower;
        clearPending();
        const found = SEQUENCE_MAP[combo];
        if (found) {
          e.preventDefault();
          handler.current(found);
        }
        return;
      }

      // Start a sequence on a known prefix key.
      if (lower === "g" || lower === "n") {
        pending.current = lower;
        timer.current = setTimeout(clearPending, 900);
        return;
      }

      const solo = SOLO_MAP[lower];
      if (solo) {
        e.preventDefault();
        handler.current(solo);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearPending();
    };
  }, [enabled]);
}
