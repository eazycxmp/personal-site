import Link from "next/link";
import Image from "next/image";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ButtonPrimary, ButtonSecondary } from "@/components/buttons";
import { DeliverabilityChecker } from "@/components/deliverability-checker";
import { caseStudies } from "@/lib/case-studies";
import { siteConfig } from "@/lib/site-config";

const TOOLS = ["HubSpot", "Clay", "n8n", "Claude API", "Apollo", "Instantly", "Fathom"];

const PRACTICES = [
  {
    n: "01",
    eyebrow: "STACK",
    title: "Custom GTM systems",
    body: "n8n workflows, Clay enrichment, HubSpot routing, AI personalization. Wired end to end. No black boxes.",
    cta: "See work",
    href: "/work",
  },
  {
    n: "02",
    eyebrow: "AUDIT",
    title: "Deliverability infrastructure",
    body: "SPF, DKIM, DMARC, sending domains, warm-up, monitoring. Get into the inbox and stay there.",
    cta: "Try the tool",
    href: "#try-it-now",
  },
  {
    n: "03",
    eyebrow: "MAINTAIN",
    title: "CRM hygiene & routing",
    body: "Dedup, enrichment fill, lead scoring, owner routing, drift alerts. Stop the quiet rot.",
    cta: "See work",
    href: "/work",
  },
];

const QUOTES = [
  '"Our outbound used to convert. Now it just sends."',
  '"Reply rates are dropping for no reason we can see."',
  '"I can\u2019t tell what our pipeline actually means anymore."',
];

export default function HomePage() {
  return (
    <>
      <Nav />
      <main className="max-w-screen-xl mx-auto">
        {/* HERO */}
        <section className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-8 px-5 md:px-8 pt-10 md:pt-16 pb-10">
          <div className="order-2 md:order-1">
            <h1 className="serif-display text-[32px] md:text-[42px] leading-[1.05] mb-4">
              GTM systems<br />
              for B2B SaaS<br />
              founders.
            </h1>
            <p className="text-[13px] md:text-[14px] text-[var(--color-ink-soft)] leading-[1.6] mb-6 md:max-w-[380px]">
              Outbound, RevOps, AI personalization. Built end-to-end with HubSpot, Clay, n8n, and
              Claude. For Series A through B teams that need infrastructure, not another deck.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <ButtonPrimary href={siteConfig.calLink} external className="w-full sm:w-auto py-3.5 sm:py-2.5">
                Book a call →
              </ButtonPrimary>
              <ButtonSecondary href="/work" className="w-full sm:w-auto py-3.5 sm:py-2.5">
                See the work
              </ButtonSecondary>
            </div>
          </div>
          <div className="order-1 md:order-2 aspect-[4/5] rounded-xl relative overflow-hidden bg-[#1B1466]">
            <Image
              src="/espen-profile.png"
              alt="Espen Campbell"
              fill
              className="object-cover object-top"
              priority
            />
            <div className="absolute bottom-3 left-3 text-[9px] text-white/70 tracking-[0.12em] leading-[1.7]">
              GTM BUILDER
              <br />
              SF · CPH
            </div>
          </div>
        </section>

        {/* TOOLS BANNER */}
        <section className="bg-[var(--color-ink)] py-4 px-5 md:px-8 flex items-center gap-5 md:gap-7 overflow-x-auto">
          {TOOLS.map((tool, i) => (
            <span key={tool} className="flex items-center gap-5 md:gap-7 shrink-0">
              <span className="serif-display italic text-[14px] md:text-[15px] text-[var(--color-cream)] whitespace-nowrap">
                {tool}
              </span>
              {i < TOOLS.length - 1 && (
                <span className="text-[var(--color-violet)] text-[6px]">●</span>
              )}
            </span>
          ))}
        </section>

        {/* DELIVERABILITY CHECKER */}
        <section id="try-it-now" className="px-5 md:px-8 pt-9 pb-7">
          <div className="flex items-baseline justify-between mb-1.5">
            <h2 className="serif-display text-[20px] md:text-[22px]">Try it now</h2>
            <span className="label-eyebrow">LIVE TOOL</span>
          </div>
          <p className="text-[12px] md:text-[13px] text-[var(--color-ink-soft)] leading-[1.55] mb-4 md:max-w-[480px]">
            Real-time SPF, DKIM, DMARC, and MX validation. A slice of the audit engine I run for
            clients. Free, no signup.
          </p>
          <DeliverabilityChecker />
          <div className="text-[10px] md:text-[11px] text-[var(--color-mute-2)] mt-2 flex flex-wrap gap-x-3 gap-y-1">
            <span><span className="score-good">●</span> 80+ Strong</span>
            <span><span className="score-mid">●</span> 70–79 Watch</span>
            <span><span className="score-bad">●</span> &lt;70 At risk</span>
          </div>
        </section>

        {/* WHAT I BUILD — INDEX TABLE */}
        <section className="px-5 md:px-8 pt-7 pb-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="serif-display text-[20px] md:text-[26px]">What I build</h2>
            <span className="label-eyebrow">3 PRACTICES</span>
          </div>
          <div className="border-t border-[var(--color-ink)]">
            {PRACTICES.map((p, i) => (
              <Link
                key={p.n}
                href={p.href}
                className={`group block py-5 ${
                  i < PRACTICES.length - 1
                    ? "border-b border-black/15"
                    : "border-b border-[var(--color-ink)]"
                } hover:bg-black/[0.015] transition-colors`}
              >
                {/* Mobile layout */}
                <div className="md:hidden">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="label-eyebrow">{p.eyebrow} · {p.n}</span>
                    <span className="text-[var(--color-accent)] text-[11px] font-medium">
                      {p.cta} →
                    </span>
                  </div>
                  <div className="serif-display text-[19px] leading-[1.15] mb-2">{p.title}</div>
                  <div className="text-[12px] text-[var(--color-ink-soft)] leading-[1.55]">
                    {p.body}
                  </div>
                </div>
                {/* Desktop layout */}
                <div className="hidden md:grid grid-cols-[60px_1.2fr_2fr_90px] gap-6 items-baseline">
                  <div className="serif-display text-[32px] text-[#C4C0B6] leading-none">{p.n}</div>
                  <div>
                    <div className="label-eyebrow mb-1">{p.eyebrow}</div>
                    <div className="serif-display text-[22px] leading-[1.1]">{p.title}</div>
                  </div>
                  <div className="text-[13px] text-[var(--color-ink-soft)] leading-[1.6]">
                    {p.body}
                  </div>
                  <div className="text-[var(--color-accent)] text-[12px] font-medium text-right">
                    {p.cta} →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* SOUND FAMILIAR */}
        <section className="px-5 md:px-8 pt-4 pb-7">
          <div className="flex items-baseline justify-between mb-3.5">
            <h2 className="serif-display text-[20px] md:text-[22px]">Sound familiar?</h2>
            <span className="label-eyebrow hidden md:block">THINGS FOUNDERS SAY</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {QUOTES.map((q, i) => (
              <div
                key={i}
                className="bg-white border border-black/10 rounded-[10px] p-4 md:p-[18px]"
              >
                <div className="label-eyebrow text-[var(--color-bad)] mb-2">↳</div>
                <div className="serif-display text-[15px] md:text-[16px] leading-[1.3]">{q}</div>
              </div>
            ))}
          </div>
        </section>

        {/* WHO I WORK WITH */}
        <section className="px-5 md:px-8 pt-1 pb-7">
          <div className="bg-white border border-black/10 rounded-lg p-4 md:p-5">
            <div className="label-eyebrow mb-2">WHO I WORK WITH</div>
            <p className="text-[13px] md:text-[14px] leading-[1.55]">
              B2B SaaS founders and early CROs at{" "}
              <span className="serif-display italic text-[var(--color-accent)] border-b border-[var(--color-accent)]">
                Series A through B
              </span>
              . Sales orgs of 5-50, with outbound that has plateaued and a CRM that&apos;s drifting.
            </p>
            <p className="text-[12px] text-[var(--color-muted)] leading-[1.55] mt-2.5">
              If your team is sending more email than ever and getting fewer replies — or your
              pipeline data is too messy to trust — that&apos;s the problem I solve.
            </p>
          </div>
        </section>

        {/* SELECTED WORK */}
        <section className="px-5 md:px-8 pt-3 pb-9">
          <div className="flex items-baseline justify-between mb-3.5">
            <h2 className="serif-display text-[20px] md:text-[22px]">Selected work</h2>
            <span className="label-eyebrow">3 PROJECTS</span>
          </div>
          <div className="flex flex-col gap-2">
            {caseStudies.map((cs) => (
              <Link
                key={cs.slug}
                href={`/work/${cs.slug}`}
                className={`${cs.gradientClass} block rounded-lg p-4 md:p-5 text-[var(--color-cream)] transition-transform hover:scale-[1.005]`}
              >
                {/* Mobile */}
                <div className="md:hidden">
                  <div className="flex justify-between items-baseline mb-2">
                    <div className="text-[9px] tracking-[0.1em] opacity-70">
                      {cs.number.split(" / ")[0]} · {cs.category.split(" · ")[0]}
                    </div>
                    <div className="text-[14px]">→</div>
                  </div>
                  <div className="serif-display text-[18px] mb-2">{cs.client}</div>
                  <div className="text-[12px] leading-[1.5] opacity-90">{cs.cardSummary}</div>
                </div>
                {/* Desktop */}
                <div className="hidden md:grid grid-cols-[1fr_1.5fr_30px] gap-5 items-center">
                  <div>
                    <div className="text-[9px] tracking-[0.1em] opacity-70">{cs.number}</div>
                    <div className="serif-display text-[18px] mt-1 mb-0.5">{cs.client}</div>
                    <div className="text-[9px] tracking-[0.1em] opacity-70">{cs.category}</div>
                  </div>
                  <div className="text-[12px] leading-[1.5] opacity-90">{cs.cardSummary}</div>
                  <div className="text-right text-[16px]">→</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 md:px-8 pb-9">
          <div className="bg-[var(--color-ink)] rounded-[10px] p-6 md:p-8 text-center text-[var(--color-cream)]">
            <h2 className="serif-display text-[24px] md:text-[32px] leading-[1.15] md:leading-[1.1] mb-2.5">
              Got an inbox that should
              <br className="hidden md:block" /> be a dashboard?
            </h2>
            <p className="text-[12px] md:text-[13px] text-white/60 mb-4 md:mb-5">
              30-min audit call. Free. No deck.
            </p>
            <a
              href={siteConfig.calLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[var(--color-cream)] text-[var(--color-ink)] px-5 py-3 rounded-full text-[13px] font-medium hover:bg-white transition-colors w-full sm:w-auto"
            >
              Book a call →
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
