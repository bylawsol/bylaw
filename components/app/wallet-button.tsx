"use client";

import * as React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { ChevronDown, LogOut, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shortAddress } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function WalletButton({ className }: { className?: string }) {
  const { publicKey, disconnect, connecting, connected, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // Avoid hydration mismatch: render a stable placeholder until mounted.
  if (!mounted) {
    return (
      <Button size="sm" variant="outline" className={className} disabled>
        <Wallet className="size-4" /> Connect
      </Button>
    );
  }

  if (!connected || !publicKey) {
    return (
      <Button
        size="sm"
        className={className}
        onClick={() => setVisible(true)}
        disabled={connecting}
      >
        <Wallet className="size-4" />
        {connecting ? "Connecting…" : "Connect Wallet"}
      </Button>
    );
  }

  const address = publicKey.toBase58();

  return (
    <div className={cn("relative", className)}>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen((o) => !o)}
        className="gap-2"
      >
        <span className="size-2 rounded-full bg-success" />
        <span className="font-mono text-xs">{shortAddress(address)}</span>
        <ChevronDown className="size-3.5" />
      </Button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-border bg-card p-1 shadow-lg">
            <div className="px-3 py-2">
              <p className="text-xs text-muted-foreground">
                {wallet?.adapter.name ?? "Wallet"}
              </p>
              <p className="break-all font-mono text-xs">{address}</p>
            </div>
            <button
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-accent"
              onClick={() => {
                disconnect().catch(() => {});
                setOpen(false);
              }}
            >
              <LogOut className="size-4" /> Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}
