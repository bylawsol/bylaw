"use client";

import { Modal } from "@/components/ui/modal";
import { Kbd } from "@/components/app/kbd";
import { SHORTCUTS, ShortcutGroup } from "@/lib/shortcuts";

const GROUPS: ShortcutGroup[] = ["Navigation", "Actions"];
const DOT: Record<ShortcutGroup, string> = {
  Navigation: "#B8B3FF",
  Actions: "#FF8FA3",
};

export function ShortcutHelp({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Keyboard shortcuts"
      description="Move around Bylaw without touching the mouse."
    >
      <div className="space-y-5">
        {GROUPS.map((group) => (
          <div key={group}>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: DOT[group] }}
              />
              {group}
            </p>
            <div className="divide-y divide-border rounded-xl border border-border">
              {SHORTCUTS.filter((s) => s.group === group).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.description}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1">
                    {s.keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
          <p className="text-sm text-muted-foreground">Close any modal</p>
          <Kbd>Esc</Kbd>
        </div>
      </div>
    </Modal>
  );
}
