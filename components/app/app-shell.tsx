"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FlaskConical,
  Gavel,
  LayoutDashboard,
  Menu,
  ScrollText,
  Send,
  Settings,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { WalletButton } from "@/components/app/wallet-button";
import { Kbd } from "@/components/app/kbd";
import { useTreasury } from "@/components/treasury-provider";
import { useShortcuts } from "@/components/app/shortcuts-provider";
import { SHORTCUTS } from "@/lib/shortcuts";
import { NETWORK_LABEL } from "@/lib/network";
import { cn, shortAddress } from "@/lib/utils";

function navKeys(href: string): string[] | undefined {
  return SHORTCUTS.find((s) => s.href === href)?.keys;
}

const NAV = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/app/bylaws", label: "Bylaws", icon: Gavel },
  { href: "/app/payouts", label: "Payouts", icon: Send },
  { href: "/app/simulator", label: "Simulator", icon: FlaskConical },
  { href: "/app/members", label: "Members", icon: Users },
  { href: "/app/audit", label: "Audit", icon: ScrollText },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { openPalette } = useShortcuts();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { mode, treasury, loading } = useTreasury();

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // First-time users (no treasury) are guided into the setup wizard.
  const needsSetup = !loading && !treasury;
  React.useEffect(() => {
    if (needsSetup) router.replace("/app/setup");
  }, [needsSetup, router]);

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-card text-foreground shadow-sm ring-1 ring-black/[0.06]"
                : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
            )}
          >
            {active && (
              <span className="absolute left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-gradient-to-b from-[#FF8FA3] to-[#9FB6FF]" />
            )}
            <item.icon
              className={cn(
                "size-4 transition-colors",
                active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
              )}
            />
            {item.label}
            {navKeys(item.href) && (
              <span className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                {navKeys(item.href)!.map((k) => (
                  <Kbd key={k} className="h-4 min-w-[16px] px-1 text-[10px]">
                    {k}
                  </Kbd>
                ))}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const storageBadge = (
    <Badge variant={mode === "supabase" ? "default" : "muted"} className="gap-1.5">
      <span
        className={cn(
          "size-1.5 rounded-full",
          mode === "supabase" ? "bg-success" : "bg-muted-foreground",
        )}
      />
      {mode === "supabase" ? "Supabase" : "Local"}
    </Badge>
  );

  return (
    <div className="card-grain min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-background/60 backdrop-blur lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-3">{nav}</div>
        <div className="border-t border-border p-4">
          <p className="truncate text-xs font-medium">
            {treasury?.name ?? "No treasury"}
          </p>
          <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
            {shortAddress(treasury?.treasuryWalletAddress)}
          </p>
          <div className="mt-3">{storageBadge}</div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-background">
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <Logo />
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">{nav}</div>
            <div className="border-t border-border p-4">{storageBadge}</div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
          <button
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <span className="size-1.5 rounded-full bg-success" />
              Solana {NETWORK_LABEL}
            </Badge>
            <span className="hidden sm:inline">{storageBadge}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={openPalette}
              className="hidden items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
              title="Command palette"
            >
              <Kbd className="border-0 bg-transparent px-0 shadow-none">⌘</Kbd>K
              <span className="text-muted-foreground/70">Command</span>
            </button>
            <WalletButton />
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          {needsSetup ? (
            <div className="flex min-h-[50vh] items-center justify-center">
              <span className="inline-block size-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
