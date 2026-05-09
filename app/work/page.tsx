import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { caseStudies, CaseStudy } from "@/lib/case-studies";

export const metadata = {
  title: "Work — Espen Campbell",
  description: "Selected GTM and RevOps case studies.",
};

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
