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
  // Property location pins appearing on a map grid — real estate software
  const pins = [
    { left: "18%", top: "22%", delay: "0s" },
    { left: "56%", top: "10%", delay: "1.3s" },
    { left: "76%", top: "28%", delay: "2.6s" },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Faint map grid */}
      <div className="absolute inset-x-6 top-8 bottom-32 grid grid-cols-4 grid-rows-2 gap-px opacity-[0.06]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border border-white rounded-sm" />
        ))}
      </div>
      {/* Location pins */}
      {pins.map((p, i) => (
        <div
          key={i}
          className="absolute flex flex-col items-center hl-pin"
          style={{ left: p.left, top: p.top, animationDelay: p.delay }}
        >
          <div className="w-4 h-4 rounded-full bg-white/55 border-2 border-white/80 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white/90" />
          </div>
          <div className="w-px h-3.5 bg-white/40" />
          <div className="w-2 h-0.5 rounded-full bg-white/25" />
        </div>
      ))}
    </div>
  );
}

function HeimdallViz() {
  // Power lines with traveling sensor pulse — electrical grid monitoring
  return (
    <div className="absolute inset-x-0 top-8 px-6 pointer-events-none">
      <svg viewBox="0 0 200 56" fill="none" className="w-full">
        {/* Top wire */}
        <line x1="0" y1="18" x2="200" y2="18" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
        {/* Bottom wire */}
        <line x1="0" y1="30" x2="200" y2="30" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
        {/* Poles */}
        <line x1="12" y1="6" x2="12" y2="52" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
        <line x1="100" y1="6" x2="100" y2="52" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
        <line x1="188" y1="6" x2="188" y2="52" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
        {/* Cross-arms */}
        <line x1="4" y1="14" x2="20" y2="14" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="92" y1="14" x2="108" y2="14" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="180" y1="14" x2="196" y2="14" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Sensor box on middle pole */}
        <rect x="93" y="21" width="14" height="9" rx="2" fill="rgba(255,255,255,0.55)" className="hm-sensor" />
        {/* Traveling pulse dots */}
        <circle cx="0" cy="18" r="3.5" fill="rgba(255,255,255,0.85)" className="hm-dot" />
        <circle cx="0" cy="30" r="3.5" fill="rgba(255,255,255,0.85)" className="hm-dot" style={{ animationDelay: "-1.6s" }} />
      </svg>
    </div>
  );
}

function GowinsViz() {
  // Tile grid filling in progressively — tile contractor laying floors
  const tiles = Array.from({ length: 12 }, (_, i) => i);
  return (
    <div
      className="absolute inset-x-6 top-10 pointer-events-none"
      style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "repeat(3, 1fr)", gap: "5px", bottom: "50%" }}
    >
      {tiles.map((i) => (
        <div
          key={i}
          className="rounded-sm border border-white/20 gw-tile"
          style={{ animationDelay: `${i * 0.14}s` }}
        />
      ))}
    </div>
  );
}

function VortexViz() {
  // Expanding oval rings — rugby ball shape pulsing outward, vortex brand
  return (
    <div className="absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute border border-white/45 vx-ring"
          style={{
            width: 40 + i * 20,
            height: 24 + i * 12,
            borderRadius: "50%",
            top: -(12 + i * 6),
            left: -(20 + i * 10),
            animationDelay: `${-i * 0.87}s`,
          }}
        />
      ))}
      <div className="w-5 h-3 rounded-full bg-white/60 relative z-10" />
    </div>
  );
}

function CardViz({ slug }: { slug: string }) {
  if (slug === "homelight") return <HomeLightViz />;
  if (slug === "heimdall-power") return <HeimdallViz />;
  if (slug === "gowins-tile") return <GowinsViz />;
  if (slug === "vortex-rugby") return <VortexViz />;
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
            Four projects.
            <br />
            Four different problems.
          </h1>
          <p className="text-[13px] md:text-[14px] text-[var(--color-ink-soft)] leading-[1.6] max-w-[480px]">
            Each one a real piece of infrastructure built end-to-end. Numbers, stack, and what got
            handed off.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {caseStudies.map((cs, i) => (
            <WorkCard key={cs.slug} cs={cs} index={i} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
