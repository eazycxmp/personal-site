import { DeliverabilityCheck } from "@/components/deliverability-check";
import { HeroReveal } from "@/components/hero-reveal";
import { FadeUp } from "@/components/fade-up";
import { WorkCard } from "@/components/work-card";
import { WorkingOn } from "@/components/working-on";
import { Marquee } from "@/components/marquee";

export default function Home() {
  return (
    <>
      <div className="max-w-6xl mx-auto px-6">
        <HeroReveal />
      </div>

      <Marquee />

      <div className="max-w-6xl mx-auto px-6 pb-32">
        <FadeUp>
          <section className="my-24">
            <div className="flex items-baseline justify-between mb-8">
              <h2 className="display-type text-4xl md:text-5xl font-medium">What I build</h2>
              <span className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider">Three practices</span>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <WorkCard number="01" href="/work#systems" tag="Stack" title="Custom GTM systems" body="n8n workflows, Clay enrichment, HubSpot routing, AI personalization. Wired together end to end. No black boxes." />
              <WorkCard number="02" href="/work#audit" tag="Audit" title="Deliverability infrastructure" body="SPF, DKIM, DMARC, warm-up, monitoring, sending domains. Get into the inbox and stay there." />
              <WorkCard number="03" href="/work#hygiene" tag="Maintain" title="CRM hygiene and routing" body="Dedup, enrichment fill, lead scoring, owner routing, drift alerts. Stop your CRM from quietly rotting." />
            </div>
          </section>
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
