"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, LayoutGrid, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NETWORK_LABEL } from "@/lib/network";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#platform", label: "Platform" },
  { href: "#workflow", label: "Workflow" },
  { href: "#use-cases", label: "Use Cases" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

function BrandLockup() {
  return (
    <Link href="/" className="group flex items-center gap-3" aria-label="Bylaw home">
      <span className="relative flex shrink-0">
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-2 rounded-2xl bg-gradient-to-br from-[#FF8FA3] via-[#B8B3FF] to-[#9FB6FF] opacity-45 blur-md transition-opacity duration-300 group-hover:opacity-70"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Bylaw" width={48} height={48} className="relative size-11" />
      </span>
      <span className="leading-tight">
        <span className="block text-[22px] font-extrabold tracking-tight text-[#242424]">
          Bylaw
        </span>
        <span className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8A8378] sm:block">
          Treasury System
        </span>
      </span>
    </Link>
  );
}

export function LandingHeader() {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-[#F4F1EA]/80 backdrop-blur-md transition-all duration-300",
        scrolled ? "border-black/[0.08] shadow-[0_6px_24px_-18px_rgba(0,0,0,0.4)]" : "border-black/[0.05]",
      )}
    >
      <div
        className={cn(
          "relative mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 transition-all duration-300 sm:px-6 lg:px-8",
          scrolled ? "h-16" : "h-[72px] sm:h-[88px]",
        )}
      >
        <BrandLockup />

        {/* Center nav capsule */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-black/10 bg-white/70 p-1.5 pl-2 shadow-[0_4px_16px_-8px_rgba(0,0,0,0.15)] backdrop-blur-md xl:flex">
          <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-[#FFD6DC] to-[#DCE6FF] text-[#5b4bd6]">
            <LayoutGrid className="size-4" />
          </span>
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-[#57534c] transition-colors hover:bg-black/[0.06] hover:text-[#242424]"
            >
              {n.label}
            </a>
          ))}
        </nav>

        {/* Right action cluster */}
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-2 text-xs font-medium text-[#57534c] backdrop-blur lg:inline-flex">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#31B36B] opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[#31B36B]" />
            </span>
            {NETWORK_LABEL} Live
            <span className="flex items-end gap-0.5" aria-hidden>
              <span className="h-2 w-0.5 rounded-full bg-[#31B36B]/50" />
              <span className="h-3 w-0.5 rounded-full bg-[#31B36B]/70" />
              <span className="h-1.5 w-0.5 rounded-full bg-[#31B36B]/40" />
            </span>
          </span>

          <Link href="/app">
            <Button className="group rounded-full bg-[#242424] px-4 font-semibold shadow-[0_10px_26px_-12px_rgba(184,179,255,0.8)] hover:bg-black sm:px-5">
              Open App
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
          </Link>

          <button
            className="flex size-10 items-center justify-center rounded-full border border-black/10 bg-white/70 backdrop-blur xl:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#B8B3FF]/45 to-transparent" />

      {/* Mobile menu */}
      {open && (
        <div className="xl:hidden">
          <div className="mx-4 mb-3 mt-2 rounded-2xl border border-black/10 bg-white/90 p-2 shadow-lg backdrop-blur">
            <nav className="flex flex-col">
              {NAV.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-[#242424] hover:bg-black/5"
                >
                  {n.label}
                </a>
              ))}
              <Link
                href="/app"
                onClick={() => setOpen(false)}
                className="mt-1 rounded-xl bg-[#242424] px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Open App
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
