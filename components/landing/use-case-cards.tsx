import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PixelSprite } from "./pixel-art";

const CARDS = [
  {
    title: "Contributor payouts",
    copy: "Pay builders, designers, mods, and operators with a signed record.",
    sprite: "worm" as const,
    spriteColor: "#FFD6DC",
    contentBg: "#FFD9DE",
    contentText: "#7a2c3c",
  },
  {
    title: "Grant approvals",
    copy: "Route grant requests through rules before funds leave the treasury.",
    sprite: "crab" as const,
    spriteColor: "#C7C3FF",
    contentBg: "#E7E4FF",
    contentText: "#3f379c",
  },
];

const PILLS = [
  "DAO operations",
  "Launchpad expenses",
  "Memecoin treasury",
  "NFT community grants",
  "Marketing budgets",
];

export function UseCaseCards() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {CARDS.map((c) => (
          <div
            key={c.title}
            className="lift overflow-hidden rounded-[22px] border border-black/10"
          >
            <div className="card-grain relative flex h-52 items-center justify-center bg-[#242424]">
              <PixelSprite
                variant={c.sprite}
                color={c.spriteColor}
                className="h-28 w-28"
              />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.08),transparent_60%)]" />
            </div>
            <div
              className="flex items-end justify-between gap-4 p-5 sm:p-6"
              style={{ backgroundColor: c.contentBg }}
            >
              <div>
                <h3
                  className="text-xl font-semibold tracking-tight"
                  style={{ color: c.contentText }}
                >
                  {c.title}
                </h3>
                <p className="mt-1.5 max-w-xs text-sm text-[#4a463f]">
                  {c.copy}
                </p>
              </div>
              <Link href="/app" className="shrink-0">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#242424] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-black">
                  Open App <ArrowUpRight className="size-3.5" />
                </span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {PILLS.map((p) => (
          <span
            key={p}
            className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-medium text-[#57534c]"
          >
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}
