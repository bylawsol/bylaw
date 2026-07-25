import {
  CheckCircle2,
  FileSignature,
  PenLine,
  ScrollText,
  Send,
  ShieldCheck,
} from "lucide-react";
import { NETWORK_LABEL } from "@/lib/network";

const STEPS = [
  {
    icon: Send,
    title: "Submit request",
    pill: "Request",
    pillClass: "bg-[#DCE6FF] text-[#3355bb]",
    iconBg: "#DCE6FF",
  },
  {
    icon: ShieldCheck,
    title: "Policy check",
    pill: "Passed",
    pillClass: "bg-[#D6F2E1] text-[#218a52]",
    iconBg: "#D6F2E1",
  },
  {
    icon: FileSignature,
    title: "Collect approvals",
    pill: "2 of 3",
    pillClass: "bg-[#EAE6FF] text-[#5b4bd6]",
    iconBg: "#EAE6FF",
  },
  {
    icon: PenLine,
    title: "Execute payout",
    pill: NETWORK_LABEL,
    pillClass: "bg-[#FFE0E5] text-[#c24d63]",
    iconBg: "#FFE0E5",
  },
  {
    icon: ScrollText,
    title: "Audit log",
    pill: "Recorded",
    pillClass: "bg-[#242424] text-white",
    iconBg: "#ECE8DF",
  },
];

export function WorkflowCard() {
  return (
    <div className="rounded-[22px] border border-black/10 bg-white p-5 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.35)] sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold tracking-tight">Payout lifecycle</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D6F2E1] px-2.5 py-1 text-xs font-medium text-[#218a52]">
          <CheckCircle2 className="size-3" /> Traceable
        </span>
      </div>

      <ol className="relative">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            {/* rail */}
            <div className="flex flex-col items-center">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: s.iconBg }}
              >
                <s.icon className="size-4 text-[#242424]" />
              </span>
              {i < STEPS.length - 1 && (
                <span className="my-1 w-px flex-1 bg-black/10" />
              )}
            </div>
            <div className="flex flex-1 items-center justify-between gap-2 pb-4">
              <div>
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-xs text-[#66625C]">Step {i + 1}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.pillClass}`}
              >
                {s.pill}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
