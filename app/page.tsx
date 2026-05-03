import { DeliverabilityCheck } from "@/components/deliverability-check";
import { HeroReveal } from "@/components/hero-reveal";
import { FadeUp } from "@/components/fade-up";
import { WorkingOn } from "@/components/working-on";
import { Marquee } from "@/components/marquee";
import { ServiceCards } from "@/components/service-cards";

export default function Home() {
  return (
    <>
      <div className="max-w-6xl mx-auto px-6">
        <HeroReveal />
      </div>

      <Marquee />

      <div className="max-w-6xl mx-auto px-6 pb-32">
        <FadeUp>
          <ServiceCards />
        </FadeUp>

        <FadeUp>
          <section className="mb-24">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="display-type text-4xl md:text-5xl font-medium">Try it now</h2>
              <span className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider">Live tool</span>
            </div>
            <p className="text-[var(--color-muted)] mb-8 max-w-2xl">
              Real-time SPF, DKIM, DMARC, and MX validation. A slice of the audit engine I am building. Free, no signup.
            </p>
            <DeliverabilityCheck />
          </section>
        </FadeUp>

        <FadeUp>
          <WorkingOn />
        </FadeUp>
      </div>
    </>
  );
}
