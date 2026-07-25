"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { NETWORK_LABEL_LOWER } from "@/lib/network";

const FAQS = [
  {
    q: "Is Bylaw a multisig?",
    a: "No. Bylaw is a policy and approval layer. Approvals are wallet signatures over a structured message; execution is a single-signer transfer from the connected Admin wallet. Smart-contract custody and multisig are planned, not shipped.",
  },
  {
    q: "Are payments real?",
    a: `Yes, on Solana ${NETWORK_LABEL_LOWER}. When a payout meets its policy and approval threshold, an Admin executes a real ${NETWORK_LABEL_LOWER} SOL transfer and the transaction signature is recorded.`,
  },
  {
    q: "Do I need a wallet?",
    a: `For approvals and execution, yes — Phantom on ${NETWORK_LABEL_LOWER}. You can explore the app and demo data without connecting, but signing and executing require a wallet.`,
  },
  {
    q: "Does this use AI agents?",
    a: "No. Bylaw is deliberately rule-based. There are no autonomous agents making decisions or moving funds — every action is a human, wallet-signed step.",
  },
  {
    q: "Is this mainnet-ready?",
    a: `Not yet. This is a ${NETWORK_LABEL_LOWER} MVP focused on the approval and audit workflow. Custody, multisig, and mainnet execution are on the roadmap, not live.`,
  },
];

export function Faq() {
  const [open, setOpen] = React.useState<number | null>(0);
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className={cn(
              "rounded-2xl border bg-white transition-colors",
              isOpen ? "border-black/15" : "border-black/10",
            )}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-medium tracking-tight text-[#242424]">
                {item.q}
              </span>
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors",
                  isOpen ? "bg-[#242424] text-white" : "bg-black/5 text-[#66625C]",
                )}
              >
                {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
              </span>
            </button>
            <div
              className={cn(
                "grid overflow-hidden px-5 text-sm text-[#57534c] transition-all duration-200",
                isOpen ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="min-h-0">{item.a}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
