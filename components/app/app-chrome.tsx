"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";

// The setup wizard renders full-screen (no sidebar chrome); every other
// /app route gets the standard AppShell.
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/app/setup") return <>{children}</>;
  return <AppShell>{children}</AppShell>;
}
