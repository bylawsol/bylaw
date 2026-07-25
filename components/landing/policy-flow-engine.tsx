import * as React from "react";
import {
  Check,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { HeroPixelField } from "@/components/landing/pixel-art";
import { NETWORK_LABEL } from "@/lib/network";

/**
 * The "Policy Flow Engine": a living product workflow — a payout request enters,
 * policy validates, approvals attach, execution queues, a receipt is recorded —
 * all connected by pastel route lines over a pixel stream. Pure CSS/SVG.
 */
export function PolicyFlowEngine() {
  return (
    <div className="relative mx-auto aspect-[4/3.05] w-full max-w-[680px]">
      {/* glows */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(42% 42% at 66% 40%, rgba(184,179,255,0.4), transparent 70%), radial-gradient(40% 40% at 40% 78%, rgba(255,143,163,0.28), transparent 70%)",
        }}
      />

      {/* pixel stream, flowing lower-left → upper-right (kept subtle) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          WebkitMaskImage:
            "linear-gradient(120deg, transparent 8%, #000 40%, #000 72%, transparent 96%)",
          maskImage:
            "linear-gradient(120deg, transparent 8%, #000 40%, #000 72%, transparent 96%)",
        }}
      >
        <HeroPixelField className="h-full w-full" />
      </div>

      {/* connector routes */}
      <svg
        viewBox="0 0 1000 760"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="routeGrad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#FF8FA3" />
            <stop offset="50%" stopColor="#B8B3FF" />
            <stop offset="100%" stopColor="#9FB6FF" />
          </linearGradient>
        </defs>
        {[
          "M 300 470 C 360 300, 470 250, 560 210", // request → policy
          "M 640 250 C 760 300, 780 330, 820 360", // policy → approvals
          "M 300 470 C 360 620, 430 640, 500 630", // request → execution
          "M 560 630 C 700 620, 760 620, 830 600", // execution → receipt
          "M 330 690 C 300 600, 300 540, 320 500", // core → request
        ].map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="url(#routeGrad)"
            strokeWidth="2.5"
            strokeDasharray="2 8"
            strokeLinecap="round"
            opacity={0.7}
          />
        ))}
        {/* travelling audit particle */}
        <circle r="4" fill="#B8B3FF" className="motion-reduce:hidden">
          <animateMotion
            dur="5.5s"
            repeatCount="indefinite"
            path="M 300 470 C 360 300, 470 250, 560 210"
            keyPoints="0;1"
            keyTimes="0;1"
            calcMode="linear"
          />
        </circle>
      </svg>

      {/* ---- Stage cards ---- */}

      {/* 1 · Payout request (focal) */}
      <StageCard
        className="left-[6%] top-[34%] w-[42%]"
        glow
        n={1}
        title="Payout request"
        icon={FileText}
      >
        <p className="text-3xl font-semibold tracking-tight text-[#242424]">
          0.50 <span className="text-lg text-[#8a857d]">SOL</span>
        </p>
        <p className="mt-1 text-sm text-[#66625C]">Contributor payout</p>
        <span className="mt-3 flex size-8 items-center justify-center rounded-full bg-[#EAE6FF] text-[#5b4bd6]">
          <Users className="size-4" />
        </span>
      </StageCard>

      {/* 2 · Policy check */}
      <StageCard
        className="left-[46%] top-[3%] w-[34%]"
        n={2}
        title="Policy check"
        icon={ShieldCheck}
      >
        <p className="text-xl font-semibold text-[#218a52]">Passed</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-[#66625C]">
          <CheckCircle2 className="size-3.5 text-success" /> 6 of 6 rules
        </p>
      </StageCard>

      {/* 3 · Approvals */}
      <StageCard
        className="left-[68%] top-[26%] w-[32%]"
        n={3}
        title="Approvals"
        icon={Users}
      >
        <p className="text-lg font-semibold text-[#242424]">
          2 <span className="text-sm font-normal text-[#8a857d]">of 3</span>
        </p>
        <p className="text-xs text-[#66625C]">Wallet-signed</p>
        <div className="mt-2 flex -space-x-1.5">
          {["#FF8FA3", "#B8B3FF", "#DCE6FF"].map((c, i) => (
            <span
              key={i}
              className="flex size-6 items-center justify-center rounded-full border-2 border-white text-[9px] text-white"
              style={{ backgroundColor: c }}
            >
              {i < 2 ? <Check className="size-3" /> : ""}
            </span>
          ))}
        </div>
      </StageCard>

      {/* 4 · Execution */}
      <StageCard
        className="left-[38%] top-[70%] w-[30%]"
        n={4}
        title="Execution"
        icon={Zap}
      >
        <p className="text-lg font-semibold text-[#5b4bd6]">{NETWORK_LABEL}</p>
        <p className="flex items-center gap-1.5 text-xs text-[#66625C]">
          <span className="inline-block size-3 animate-spin rounded-full border-2 border-[#B8B3FF] border-t-transparent motion-reduce:animate-none" />
          Ready to send
        </p>
      </StageCard>

      {/* 5 · Receipt */}
      <StageCard
        className="left-[70%] top-[72%] w-[30%]"
        n={5}
        title="Receipt"
        icon={FileText}
      >
        <p className="text-lg font-semibold text-[#5b4bd6]">Recorded</p>
        <p className="flex items-center gap-1.5 text-xs text-[#66625C]">
          Audit log <CheckCircle2 className="size-3.5 text-success" />
        </p>
      </StageCard>

      {/* Policy core node */}
      <div className="absolute left-[20%] top-[80%] flex -translate-x-1/2 flex-col items-center">
        <div className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EAE6FF] to-[#DCE6FF] shadow-[0_16px_36px_-18px_rgba(90,75,214,0.7)]">
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/60" />
          <ShieldCheck className="size-6 text-[#5b4bd6]" />
        </div>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a857d]">
          Policy core
        </p>
        <p className="text-[10px] text-[#a49f96]">Rules · Limits · Roles</p>
      </div>
    </div>
  );
}

function StageCard({
  className,
  n,
  title,
  icon: Icon,
  glow,
  children,
}: {
  className?: string;
  n: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  glow?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`absolute rounded-2xl border border-black/10 bg-[#FFFDF7]/95 p-4 backdrop-blur ${
        glow
          ? "shadow-[0_28px_60px_-26px_rgba(255,143,163,0.65)] ring-1 ring-[#FF8FA3]/25"
          : "shadow-[0_20px_46px_-28px_rgba(60,40,110,0.5)]"
      } ${className ?? ""}`}
    >
      <div className="flex items-center gap-2">
        <span className="flex size-5 items-center justify-center rounded-md bg-black/5 text-[10px] font-semibold text-[#66625C]">
          {n}
        </span>
        <span className="text-sm font-semibold text-[#242424]">{title}</span>
        <Icon className="ml-auto size-4 text-[#8a857d]" />
      </div>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}
