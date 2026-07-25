"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, Check, Copy, Printer } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ReceiptView } from "@/components/receipt/receipt-view";
import { findPayoutById } from "@/lib/storage";
import { Payout, Treasury } from "@/lib/types";

export default function ReceiptPage() {
  const params = useParams<{ payoutId: string }>();
  const payoutId = params.payoutId;

  const [state, setState] = React.useState<
    | { status: "loading" }
    | { status: "found"; treasury: Treasury; payout: Payout }
    | { status: "missing" }
  >({ status: "loading" });
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    findPayoutById(payoutId).then((res) => {
      if (!alive) return;
      setState(res ? { status: "found", ...res } : { status: "missing" });
    });
    return () => {
      alive = false;
    };
  }, [payoutId]);

  const copyLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard
      ?.writeText(`${window.location.origin}/receipt/${payoutId}`)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
  };

  return (
    <div className="bg-cream-noise min-h-screen text-[#242424]">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-14">
        {/* action bar (hidden when printing) */}
        <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
          <Link href="/" aria-label="Bylaw home">
            <Logo />
          </Link>
          {state.status === "found" && (
            <div className="flex items-center gap-2">
              <button
                onClick={copyLink}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/70 px-3 py-2 text-xs font-medium text-[#242424] hover:bg-white"
              >
                {copied ? (
                  <Check className="size-3.5 text-success" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? "Copied" : "Copy link"}
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/70 px-3 py-2 text-xs font-medium text-[#242424] hover:bg-white"
              >
                <Printer className="size-3.5" /> Print
              </button>
            </div>
          )}
        </div>

        {state.status === "loading" && (
          <div className="flex min-h-[40vh] items-center justify-center">
            <span className="inline-block size-6 animate-spin rounded-full border-2 border-[#66625C] border-t-transparent" />
          </div>
        )}

        {state.status === "missing" && (
          <div className="rounded-[24px] border border-black/10 bg-[#FFFDF7] p-10 text-center">
            <h1 className="text-xl font-semibold tracking-tight">
              Receipt not found
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[#66625C]">
              This receipt isn&apos;t available in this browser. In Local mode,
              treasuries only exist on the device that created them.
            </p>
            <Link href="/app" className="mt-6 inline-block">
              <Button className="rounded-full">
                Open Bylaw <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        )}

        {state.status === "found" && (
          <>
            <ReceiptView treasury={state.treasury} payout={state.payout} />
            <div className="mt-8 text-center print:hidden">
              <p className="text-sm text-[#66625C]">
                Policy-bound payouts for onchain teams.
              </p>
              <Link href="/app" className="mt-3 inline-block">
                <Button className="rounded-full bg-[#242424] hover:bg-black">
                  Run payouts with Bylaw <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
