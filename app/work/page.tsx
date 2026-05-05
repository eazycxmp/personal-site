import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { caseStudies, CaseStudy } from "@/lib/case-studies";

export const metadata = {
  title: "Work — Espen Campbell",
  description: "Selected GTM and RevOps case studies.",
};

// ── Per-card animated background visual ──────────────────────────────────────

function HomeLightViz() {
  const bars = [
    { w: "60%", delay: "0s" },
    { w: "88%", delay: "0.5s" },
    { w: "42%", delay: "1.0s" },
    { w: "74%", delay: "1.5s" },
    { w: "55%", delay: "2.0s" },
  ];
  return (
    <div className="absolute inset-x-8 top-16 space-y-3 pointer-events-none">
      {bars.map((b, i) => (
        <div key={i} className="h-[2px] bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/35 rounded-full hl-bar"
            style={{ width: b.w, animationDelay: b.delay }}
          />
        </div>
      ))}
    </div>
  );
}

function HeimdallViz() {
  return (
    <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute rounded-full border border-white/40 hm-ring"
          style={{
            width: 48,
            height: 48,
            top: -24,
            left: -24,
            animationDelay: `${i * 0.93}s`,
          }}
        />
      ))}
      <div className="w-2.5 h-2.5 rounded-full bg-white/60 relative z-10" />
    </div>
  );
}

function GowinsViz() {
  const heights = [28, 52, 38, 72, 58, 88, 64];
  return (
    <div className="absolute inset-x-8 top-12 bottom-40 flex items-end gap-1.5 pointer-events-none">
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-white/22 rounded-t-sm gw-bar"
          style={{ height: `${h}%`, animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </div>
  );
}

function CardViz({ slug }: { slug: string }) {
  if (slug === "homelight") return <HomeLightViz />;
  if (slug === "heimdall-power") return <HeimdallViz />;
  if (slug === "gowins-tile") return <GowinsViz />;
  return null;
}

// ── Card ─────────────────────────────────────────────────────────────────────

function WorkCard({ cs, index }: { cs: CaseStudy; index: number }) {
  return (
    <Link href={`/work/${cs.slug}`} className="group block">
      <article
        className={`${cs.gradientClass} relative overflow-hidden rounded-2xl aspect-[5/4] md:aspect-square flex flex-col justify-between p-6 md:p-8 text-white hover:scale-[1.02] transition-transform duration-300`}
      >
        {/* Ambient depth circles */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/[0.05] blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-40 h-40 rounded-full bg-black/[0.15] blur-2xl pointer-events-none" />

        {/* Per-card animation */}
        <CardViz slug={cs.slug} />

        {/* Top row */}
        <div className="relative flex justify-between items-start">
          <span className="serif-display text-[52px] leading-none text-white/14">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="font-mono text-[9px] text-white/50 uppercase tracking-widest text-right leading-[1.8]">
            {cs.category.replace(" · ", "\n")}
          </span>
        </div>

        {/* Bottom block */}
        <div className="relative">
          <div className="serif-display text-[26px] md:text-[30px] leading-[1.05] mb-1.5">
            {cs.client}
          </div>
          <div className="serif-display italic text-[13px] md:text-[14px] text-white/60 mb-5 leading-[1.35] whitespace-pre-line">
            {cs.title}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {cs.metrics.map((m) => (
              <div key={m.l}>
                <div className="serif-display text-[18px] md:text-[20px] leading-none">
                  {m.v}
                </div>
                <div className="font-mono text-[8px] text-white/50 uppercase tracking-wider mt-1 leading-tight">
                  {m.l}
                </div>
              </div>
            ))}
          </div>

          <div className="font-mono text-[10px] text-white/50 uppercase tracking-widest group-hover:text-white/80 transition-colors">
            View case →
          </div>
        </div>
      </article>
    </Link>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function WorkIndexPage() {
  return (
    <>
      <Nav />
      <main className="max-w-screen-xl mx-auto px-5 md:px-8 pt-12 md:pt-16 pb-16">
        <div className="mb-12">
          <div className="label-eyebrow mb-3.5">WORK</div>
          <h1 className="serif-display text-[40px] md:text-[56px] leading-[1.05] mb-3">
            Three projects.
            <br />
            Three different problems.
          </h1>
          <p className="text-[13px] md:text-[14px] text-[var(--color-ink-soft)] leading-[1.6] max-w-[480px]">
            Each one a real piece of infrastructure built end-to-end. Numbers, stack, and what got
            handed off.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {caseStudies.map((cs, i) => (
            <WorkCard key={cs.slug} cs={cs} index={i} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
