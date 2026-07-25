import {
  CheckCircle2,
  FileText,
  ScrollText,
  Users,
  Zap,
} from "lucide-react";

const EVENTS = [
  { label: "payout_created", time: "10:42:11", icon: FileText, dot: "#FF8FA3" },
  { label: "policy_passed", time: "10:42:13", icon: CheckCircle2, dot: "#31B36B" },
  { label: "approval_signed", time: "10:42:16", icon: Users, dot: "#B8B3FF" },
  { label: "payout_ready", time: "10:42:18", icon: Zap, dot: "#9FB6FF" },
  { label: "receipt_recorded", time: "10:42:20", icon: ScrollText, dot: "#5b4bd6" },
];

export function HeroAuditRail() {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/60 p-3 backdrop-blur-md sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex shrink-0 items-center gap-3 border-black/10 pr-4 lg:border-r">
          <span className="flex size-9 items-center justify-center rounded-full border border-black/10 bg-white">
            <ScrollText className="size-4 text-[#5b4bd6]" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#242424]">Audit trail</p>
            <p className="text-xs text-[#8a857d]">Live workflow preview</p>
          </div>
        </div>

        <div className="no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto pb-1 lg:justify-between lg:pb-0">
          {EVENTS.map((e, i) => (
            <div key={e.label} className="flex shrink-0 items-center gap-1">
              <div className="flex items-center gap-1.5 rounded-lg border border-black/10 bg-[#FFFDF7] px-2.5 py-1.5">
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: e.dot }}
                />
                <span className="font-mono text-[11px] font-medium text-[#242424]">
                  {e.label}
                </span>
                <span className="font-mono text-[10px] text-[#a49f96]">
                  {e.time}
                </span>
              </div>
              {i < EVENTS.length - 1 && (
                <span className="text-xs text-[#c9c4ba]">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
