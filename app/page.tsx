import Link from "next/link";
import { ArrowRight, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "@/components/landing/landing-header";
import { HeroPixelField } from "@/components/landing/pixel-art";
import { PolicyFlowEngine } from "@/components/landing/policy-flow-engine";
import { HeroAuditRail } from "@/components/landing/hero-audit-rail";
import { DarkMetricsBand } from "@/components/landing/dark-metrics-band";
import { WorkflowCard } from "@/components/landing/workflow-card";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { UseCaseCards } from "@/components/landing/use-case-cards";
import { CircularSystemDiagram } from "@/components/landing/circular-system-diagram";
import { PricingCards } from "@/components/landing/pricing-cards";
import { Faq } from "@/components/landing/faq";
import { NETWORK_LABEL, NETWORK_LABEL_LOWER } from "@/lib/network";

const TRUST = [
  "Wallet-signed approvals",
  `${NETWORK_LABEL} SOL payouts`,
  "Exportable audit log",
];

function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-cream-noise text-[#252525]">
      <LandingHeader />

      {/* ===================== HERO ===================== */}
      <section className="relative w-full overflow-hidden">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-8 px-5 pb-8 pt-8 sm:px-8 lg:min-h-[700px] lg:grid-cols-[0.84fr_1.16fr] lg:gap-6 lg:pb-4 lg:pt-14">
          {/* Left copy */}
          <div className="max-w-xl">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-[#57534c]">
              <span className="size-1.5 rounded-full bg-[#31B36B]" />
              Solana {NETWORK_LABEL} MVP
            </span>

            <h1 className="mt-6 text-[3rem] font-semibold leading-[0.95] tracking-[-0.03em] sm:text-6xl lg:text-[4.6rem]">
              Rules before
              <br />
              treasury spend.
            </h1>

            <p className="mt-6 max-w-lg text-lg text-[#57534c]">
              Bylaw enforces policy-bound payouts. Every request is validated,
              approved, signed, executed, and left as a receipt — no spreadsheets,
              no blind transfers.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/app">
                <Button size="lg" className="rounded-full bg-[#242424] hover:bg-black">
                  Open App <ArrowRight className="size-4" />
                </Button>
              </Link>
              <a href="#workflow">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-black/15 bg-transparent hover:bg-black/5"
                >
                  See workflow <ArrowRight className="size-4" />
                </Button>
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {TRUST.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/60 px-3.5 py-2 text-sm font-medium text-[#57534c]"
                >
                  <span className="size-1.5 rounded-full bg-gradient-to-r from-[#FF8FA3] to-[#9FB6FF]" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right — Policy Flow Engine (desktop) */}
          <div className="relative hidden lg:block">
            <PolicyFlowEngine />
          </div>

          {/* Mobile pixel accent */}
          <div className="relative -mt-2 h-[170px] w-full overflow-hidden lg:hidden">
            <div
              className="absolute right-0 top-0 h-full w-[440px] max-w-none"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to right, transparent 0%, #000 45%, #000 100%)",
                maskImage:
                  "linear-gradient(to right, transparent 0%, #000 45%, #000 100%)",
              }}
            >
              <HeroPixelField className="h-full w-full" />
            </div>
          </div>
        </div>

        {/* Audit trail rail */}
        <div className="mx-auto max-w-[1440px] px-5 pb-8 sm:px-8">
          <HeroAuditRail />
        </div>
      </section>

      {/* ===================== METRICS BAND ===================== */}
      <section className="w-full pb-10 pt-2 sm:pb-14 sm:pt-4">
        <Container>
          <DarkMetricsBand />
        </Container>
      </section>

      {/* ===================== WORKFLOW ===================== */}
      <section id="workflow" className="w-full scroll-mt-24 py-20 sm:py-28">
        <Container>
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <Eyebrow>The workflow</Eyebrow>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.02em] sm:text-5xl sm:leading-[1.02]">
                From request to receipt, without chaos.
              </h2>
              <p className="mt-5 max-w-md text-lg text-[#57534c]">
                Treasury ops should be boring, traceable, and hard to mess up.
                Bylaw turns every payout into an ordered, signed, recorded flow.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {[
                  "Rules before spend",
                  "Approvals before execution",
                  "Every payout leaves a trail",
                ].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-medium text-[#57534c]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <WorkflowCard />
          </div>
        </Container>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section id="platform" className="w-full scroll-mt-24 py-20 sm:py-28">
        <Container>
          <div className="max-w-2xl">
            <Eyebrow>Platform</Eyebrow>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.02em] sm:text-5xl sm:leading-[1.02]">
              Controls that make spending deliberate.
            </h2>
          </div>
          <div className="mt-12">
            <FeatureGrid />
          </div>
        </Container>
      </section>

      {/* ===================== USE CASES ===================== */}
      <section id="use-cases" className="w-full scroll-mt-24 py-20 sm:py-28">
        <Container>
          <div className="max-w-2xl">
            <Eyebrow>Use cases</Eyebrow>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.02em] sm:text-5xl sm:leading-[1.02]">
              Built for teams that move funds.
            </h2>
          </div>
          <div className="mt-12">
            <UseCaseCards />
          </div>
        </Container>
      </section>

      {/* ===================== SYSTEM LOOP ===================== */}
      <section className="w-full py-20 sm:py-28">
        <Container>
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <Eyebrow>One loop</Eyebrow>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.02em] sm:text-5xl sm:leading-[1.02]">
                Five stages. One payout loop.
              </h2>
              <p className="mt-5 max-w-md text-lg text-[#57534c]">
                Rules shape requests. Requests gather signatures. Signatures
                unlock execution. Execution writes the audit log. The audit log
                is the product.
              </p>
            </div>
            <CircularSystemDiagram />
          </div>
        </Container>
      </section>

      {/* ===================== HONESTY (full-bleed dark) ===================== */}
      <section className="card-grain w-full bg-[#242424] py-20 text-white sm:py-28">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/70">
                <span className="size-1.5 rounded-full bg-[#FF8FA3]" />
                Straight talk
              </span>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.02em] sm:text-6xl sm:leading-[1.02]">
                No fake autonomy.
              </h2>
              <p className="mt-5 max-w-md text-lg text-white/60">
                Bylaw does not pretend to be an AI fund manager. It gives crypto
                teams a working approval layer for real wallet-signed payout
                workflows.
              </p>
            </div>
            <div className="grid gap-4">
              {[
                { t: "No yield promises", c: "#FF8FA3" },
                { t: "No invisible agents", c: "#B8B3FF" },
                { t: "No dead features", c: "#9FB6FF" },
              ].map((p) => (
                <div
                  key={p.t}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-5"
                >
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: p.c }}
                  />
                  <span className="text-lg font-medium">{p.t}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ===================== PRICING ===================== */}
      <section id="pricing" className="w-full scroll-mt-24 py-20 sm:py-28">
        <Container>
          <div className="max-w-2xl">
            <Eyebrow>Pricing</Eyebrow>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.02em] sm:text-5xl sm:leading-[1.02]">
              Free while it&apos;s a {NETWORK_LABEL_LOWER} MVP.
            </h2>
            <p className="mt-5 text-lg text-[#57534c]">
              Only the Free plan is live today. Team and Protocol are on the
              roadmap and are clearly marked as not yet available.
            </p>
          </div>
          <div className="mt-12">
            <PricingCards />
          </div>
        </Container>
      </section>

      {/* ===================== FAQ ===================== */}
      <section id="faq" className="w-full scroll-mt-24 py-20 sm:py-28">
        <Container>
          <div className="text-center">
            <Eyebrow className="justify-center">FAQ</Eyebrow>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
              Straight answers.
            </h2>
          </div>
          <div className="mt-12">
            <Faq />
          </div>
        </Container>
      </section>

      {/* ===================== FINAL CTA ===================== */}
      <section className="w-full py-16 sm:py-20">
        <Container>
          <div className="relative overflow-hidden rounded-[32px] border border-black/10 bg-[#FFFDF7] px-6 py-20 text-center sm:py-28">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-56 opacity-80"
              style={{
                background:
                  "radial-gradient(60% 90% at 50% 0%, rgba(184,179,255,0.35), transparent 70%)",
              }}
            />
            <div
              className="pointer-events-none absolute -right-10 bottom-0 h-56 w-72 opacity-70"
              style={{
                background:
                  "radial-gradient(60% 60% at 70% 80%, rgba(255,143,163,0.30), transparent 70%)",
              }}
            />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-[#57534c]">
                <Rocket className="size-3.5" /> Ready when you are
              </span>
              <h2 className="mt-6 text-4xl font-semibold tracking-[-0.02em] sm:text-6xl">
                Treasury ops without chaos.
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-lg text-[#57534c]">
                Approvals before execution. Every payout leaves a trail.
              </p>
              <div className="mt-9 flex justify-center">
                <Link href="/app">
                  <Button
                    size="lg"
                    className="rounded-full bg-[#242424] hover:bg-black"
                  >
                    Open App <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="w-full border-t border-black/10 py-12">
        <Container>
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <Logo />
              <p className="mt-2 text-sm text-[#6B665F]">
                Policy-bound payouts for onchain teams.
              </p>
            </div>
            <nav className="flex flex-wrap justify-center gap-x-7 gap-y-2 text-sm text-[#57534c]">
              <a href="#platform" className="hover:text-[#242424]">Platform</a>
              <a href="#use-cases" className="hover:text-[#242424]">Use Cases</a>
              <a href="#pricing" className="hover:text-[#242424]">Pricing</a>
              <a href="#faq" className="hover:text-[#242424]">FAQ</a>
            </nav>
            <Link href="/app">
              <Button
                variant="outline"
                className="rounded-full border-black/15 bg-transparent hover:bg-black/5"
              >
                Open App <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-8 border-t border-black/10 pt-6 text-center text-xs text-[#8a857d] sm:text-left">
            Solana {NETWORK_LABEL_LOWER} MVP. Not a custodial multisig.
          </div>
        </Container>
      </footer>
    </main>
  );
}

function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="size-1.5 rounded-full bg-gradient-to-r from-[#FF8FA3] to-[#9FB6FF]" />
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#8a857d]">
        {children}
      </span>
    </div>
  );
}
