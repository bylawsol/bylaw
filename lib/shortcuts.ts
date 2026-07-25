// Single source of truth for keyboard shortcuts + command palette entries.

export type ShortcutGroup = "Navigation" | "Actions";

export interface Shortcut {
  id: string;
  label: string;
  description: string;
  keys: string[]; // display keys, e.g. ["G","D"] or ["⌘","K"] or ["S"]
  group: ShortcutGroup;
  href?: string; // for navigation-style shortcuts
  danger?: boolean; // reserved — never bound to a direct destructive action
}

export const SHORTCUTS: Shortcut[] = [
  // Navigation
  {
    id: "go-dashboard",
    label: "Dashboard",
    description: "Go to the treasury dashboard",
    keys: ["G", "D"],
    group: "Navigation",
    href: "/app",
  },
  {
    id: "go-payouts",
    label: "Payouts",
    description: "View payout requests",
    keys: ["G", "P"],
    group: "Navigation",
    href: "/app/payouts",
  },
  {
    id: "go-bylaws",
    label: "Bylaws",
    description: "Edit treasury rules",
    keys: ["G", "B"],
    group: "Navigation",
    href: "/app/bylaws",
  },
  {
    id: "go-members",
    label: "Members",
    description: "Manage treasury members",
    keys: ["G", "M"],
    group: "Navigation",
    href: "/app/members",
  },
  {
    id: "go-audit",
    label: "Audit log",
    description: "View the audit trail",
    keys: ["G", "A"],
    group: "Navigation",
    href: "/app/audit",
  },
  {
    id: "go-settings",
    label: "Settings",
    description: "Treasury settings",
    keys: ["G", "S"],
    group: "Navigation",
    href: "/app/settings",
  },
  {
    id: "go-simulator",
    label: "Policy simulator",
    description: "Test a payout against the rules",
    keys: ["S"],
    group: "Navigation",
    href: "/app/simulator",
  },

  // Actions
  {
    id: "command-palette",
    label: "Command palette",
    description: "Search commands and navigate",
    keys: ["⌘", "K"],
    group: "Actions",
  },
  {
    id: "new-payout",
    label: "New payout request",
    description: "Submit a payout for policy review",
    keys: ["N", "P"],
    group: "Actions",
    href: "/app/payouts?new=1",
  },
  {
    id: "new-treasury",
    label: "New treasury",
    description: "Open the setup wizard",
    keys: ["N", "T"],
    group: "Actions",
    href: "/app/setup",
  },
  {
    id: "export-audit",
    label: "Export audit log",
    description: "Download the audit trail as JSON",
    keys: ["E"],
    group: "Actions",
  },
  {
    id: "shortcut-help",
    label: "Keyboard shortcuts",
    description: "Show all shortcuts",
    keys: ["?"],
    group: "Actions",
  },
];

// Derived lookups for the key handler.
export const SEQUENCE_MAP: Record<string, string> = {};
export const SOLO_MAP: Record<string, string> = {};
for (const s of SHORTCUTS) {
  if (s.id === "command-palette" || s.id === "shortcut-help") continue;
  if (s.keys.length === 2 && /^[A-Za-z]$/.test(s.keys[0])) {
    SEQUENCE_MAP[(s.keys[0] + s.keys[1]).toLowerCase()] = s.id;
  } else if (s.keys.length === 1 && /^[A-Za-z]$/.test(s.keys[0])) {
    SOLO_MAP[s.keys[0].toLowerCase()] = s.id;
  }
}
