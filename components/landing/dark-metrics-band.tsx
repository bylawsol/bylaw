import { NETWORK_LABEL } from "@/lib/network";

const AUDIENCES = [
  "DAOs",
  "Launchpads",
  "Grant Teams",
  "NFT Communities",
  "Memecoins",
];

const STATS = [
  { value: "2-of-3", label: "Approval threshold", accent: "#FF8FA3" },
  { value: NETWORK_LABEL, label: "Executable payouts", accent: "#B8B3FF" },
  { value: "100%", label: "Wallet-signed records", accent: "#9FB6FF" },
  { value: "JSON", label: "Exportable audit log", accent: "#9BE7C0" },
];

export function DarkMetricsBand() {
  return (
    <div className="card-grain rounded-[28px] bg-[#242424] p-7 text-white sm:p-12">
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 border-b border-white/10 pb-8 sm:justify-between">
        <span className="text-xs uppercase tracking-[0.2em] text-white/40">
          Built for
        </span>
        {AUDIENCES.map((a) => (
          <span
            key={a}
            className="text-base font-medium tracking-tight text-white/70"
          >
            {a}
          </span>
        ))}
      </div>

      <div className="mt-9 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-7"
          >
            <span
              className="block size-2.5 rounded-full"
              style={{ backgroundColor: s.accent }}
            />
            <p className="mt-8 text-3xl font-semibold tracking-tight sm:text-4xl">
              {s.value}
            </p>
            <p className="mt-1.5 text-sm text-white/55 sm:text-base">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-7 text-xs text-white/40 sm:text-sm">
        Product capabilities of the current MVP — not usage, volume, or adoption
        claims.
      </p>
    </div>
  );
}
