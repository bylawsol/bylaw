"use client";

import { SolanaWalletProvider } from "@/components/wallet-provider";
import { TreasuryProvider } from "@/components/treasury-provider";
import { ShortcutsProvider } from "@/components/app/shortcuts-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SolanaWalletProvider>
      <TreasuryProvider>
        <ShortcutsProvider>{children}</ShortcutsProvider>
      </TreasuryProvider>
    </SolanaWalletProvider>
  );
}
