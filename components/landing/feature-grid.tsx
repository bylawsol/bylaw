import * as React from "react";
import { PixelChips } from "./pixel-art";

/* --- Small bespoke card graphics (pure SVG/CSS, no assets) --- */

function LimitGraphic() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5">
      {[76, 48, 30].map((w, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-2.5 flex-1 rounded-full bg-black/10">
            <div
              className="h-full rounded-full"
              style={{
                width: `${w}%`,
                background:
                  "linear-gradient(90deg,#FF8FA3,#C9A7F0,#9FB6FF)",
              }}
            />
          </div>
          <span className="size-3.5 rounded-[4px] bg-white shadow ring-1 ring-black/10" />
        </div>
      ))}
    </div>
  );
}

function ApprovalsGraphic() {
  return (
    <div className="flex h-full items-center gap-3">
      <div className="flex -space-x-2">
        {["#FF8FA3", "#B8B3FF", "#9FB6FF"].map((c, i) => (
          <span
            key={i}
            className="flex size-9 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white shadow-sm"
            style={{ backgroundColor: c }}
          >
            ✓
          </span>
        ))}
      </div>
      <div className="h-px flex-1 bg-black/10" />
      <span className="rounded-lg bg-[#242424] px-2.5 py-1 text-xs font-medium text-white">
        Signed
      </span>
    </div>
  );
}

function RecipientGraphic() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="grid grid-cols-6 gap-1.5">
        {Array.from({ length: 12 }).map((_, i) => {
          const on = [0, 2, 3, 5, 6, 8, 9, 11].includes(i);
          return (
            <span
              key={i}
              className="size-4 rounded-[5px]"
              style={{
                background: on
                  ? "linear-gradient(135deg,#B8B3FF,#9FB6FF)"
                  : "rgba(0,0,0,0.06)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function AuditGraphic() {
  return (
    <div className="flex h-full flex-col justify-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-2 py-1.5"
          style={{ marginLeft: i * 12 }}
        >
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: ["#31B36B", "#B8B3FF", "#FF8FA3"][i] }}
          />
          <span className="h-1.5 w-14 rounded-full bg-black/10" />
        </div>
      ))}
    </div>
  );
}

const FEATURES = [
  {
    title: "Set payout limits",
    copy: "Define max payout size, monthly budget, and liquidity rules.",
    bg: "#FFD9DE",
    graphic: <LimitGraphic />,
    chips: ["#FF8FA3", "#FFB3C0", "#FFD6DC"],
  },
  {
    title: "Require approvals",
    copy: "Collect wallet-signed approvals before money moves.",
    bg: "#E7E4FF",
    graphic: <ApprovalsGraphic />,
    chips: ["#B8B3FF", "#9FB6FF", "#D8D4FF"],
  },
  {
    title: "Restrict recipients",
    copy: "Allowlist contributor, grant, and vendor wallets.",
    bg: "#DCE6FF",
    graphic: <RecipientGraphic />,
    chips: ["#9FB6FF", "#B8B3FF", "#C7D4FF"],
  },
  {
    title: "Track every action",
    copy: "Every request, signature, rejection, and transaction is recorded.",
    bg: "#D6F2E1",
    graphic: <AuditGraphic />,
    chips: ["#31B36B", "#7FD9A6", "#BEEDD1"],
  },
];

export function FeatureGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {FEATURES.map((f) => (
        <div
          key={f.title}
          className="lift group flex flex-col justify-between rounded-[22px] border border-black/10 p-6 sm:p-8"
          style={{ backgroundColor: f.bg }}
        >
          <div className="mb-8 h-36 rounded-2xl bg-white/45 p-5 sm:h-40">
            {f.graphic}
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold tracking-tight text-[#242424] sm:text-2xl">
                {f.title}
              </h3>
              <PixelChips colors={f.chips} className="flex gap-1" />
            </div>
            <p className="mt-2 text-sm text-[#57534c] sm:text-base">{f.copy}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
