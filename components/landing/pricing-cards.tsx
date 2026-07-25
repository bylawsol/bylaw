import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { NETWORK_LABEL } from "@/lib/network";

interface Plan {
  name: string;
  price: string;
  priceSuffix?: string;
  audience: string;
  includes: string[];
  theme: "light" | "lavender" | "dark";
  cta:
    | { kind: "link"; label: string; href: string }
    | { kind: "disabled"; label: string }
    | { kind: "info"; label: string };
  ribbon?: string;
}

const PLANS: Plan[] = [
  {
    name: `Free ${NETWORK_LABEL} MVP`,
    price: "$0",
    priceSuffix: "/forever",
    audience: "Teams testing wallet-signed payout workflows",
    includes: [
      "Unlimited treasuries",
      "Wallet-signed approvals",
      `${NETWORK_LABEL} SOL payouts`,
      "Audit export",
    ],
    theme: "light",
    cta: { kind: "link", label: "Open App", href: "/app" },
  },
  {
    name: "Team",
    price: "Soon",
    audience: "Small crypto teams that need shared payout controls",
    includes: [
      "Multiple treasuries",
      "Member roles",
      "Advanced policy templates",
      "Team audit views",
    ],
    theme: "lavender",
    cta: { kind: "disabled", label: "Not live yet" },
    ribbon: "In progress",
  },
  {
    name: "Protocol",
    price: "Custom",
    audience: "Protocols that need deeper treasury infrastructure",
    includes: [
      "Smart-contract custody planning",
      "Multisig integration planning",
      "Custom policy engine",
      "Exportable compliance records",
    ],
    theme: "dark",
    cta: { kind: "info", label: "Available on request — not yet live" },
  },
];

export function PricingCards() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {PLANS.map((p) => {
        const dark = p.theme === "dark";
        const bg =
          p.theme === "dark"
            ? "#242424"
            : p.theme === "lavender"
              ? "#E7E4FF"
              : "#FFFFFF";
        return (
          <div
            key={p.name}
            className="lift relative flex flex-col rounded-[22px] border p-6 sm:p-7"
            style={{
              backgroundColor: bg,
              borderColor: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)",
              color: dark ? "#fff" : "#242424",
            }}
          >
            {p.ribbon && (
              <span className="absolute right-5 top-6 rounded-full bg-[#242424] px-2.5 py-1 text-[11px] font-medium text-white">
                {p.ribbon}
              </span>
            )}
            <h3 className="text-lg font-semibold tracking-tight">{p.name}</h3>
            <p
              className="mt-1 text-sm"
              style={{ color: dark ? "rgba(255,255,255,0.6)" : "#66625C" }}
            >
              {p.audience}
            </p>

            <div className="mt-6 flex items-baseline gap-1.5">
              <span className="text-4xl font-semibold tracking-tight">
                {p.price}
              </span>
              {p.priceSuffix && (
                <span
                  className="text-sm"
                  style={{
                    color: dark ? "rgba(255,255,255,0.6)" : "#66625C",
                  }}
                >
                  {p.priceSuffix}
                </span>
              )}
            </div>

            {/* CTA */}
            <div className="mt-6">
              {p.cta.kind === "link" ? (
                <Link href={p.cta.href} className="block">
                  <span className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#242424] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-black">
                    {p.cta.label} <ArrowRight className="size-4" />
                  </span>
                </Link>
              ) : p.cta.kind === "disabled" ? (
                <button
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-medium text-[#66625C]"
                >
                  {p.cta.label}
                </button>
              ) : (
                <div
                  className="w-full rounded-xl border px-4 py-3 text-center text-xs font-medium"
                  style={{
                    borderColor: dark
                      ? "rgba(255,255,255,0.18)"
                      : "rgba(0,0,0,0.1)",
                    color: dark ? "rgba(255,255,255,0.7)" : "#66625C",
                  }}
                >
                  {p.cta.label}
                </div>
              )}
            </div>

            <div
              className="mt-6 border-t pt-5"
              style={{
                borderColor: dark
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(0,0,0,0.08)",
              }}
            >
              <p
                className="mb-3 text-xs font-medium uppercase tracking-wider"
                style={{ color: dark ? "rgba(255,255,255,0.5)" : "#8a857d" }}
              >
                What&apos;s included
              </p>
              <ul className="space-y-2.5">
                {p.includes.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span
                      className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: dark ? "rgba(255,255,255,0.14)" : "#D6F2E1",
                      }}
                    >
                      <Check
                        className="size-3"
                        style={{ color: dark ? "#fff" : "#218a52" }}
                      />
                    </span>
                    <span style={{ color: dark ? "rgba(255,255,255,0.85)" : "#3f3b35" }}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}
