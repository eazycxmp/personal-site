import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { caseStudies } from "@/lib/case-studies";

export const metadata = {
  title: "Work — Espen Campbell",
  description: "Selected GTM and RevOps case studies.",
};

export default function WorkIndexPage() {
  return (
    <>
      <Nav />
      <main className="max-w-screen-xl mx-auto px-5 md:px-8 pt-12 md:pt-16 pb-9">
        <div className="label-eyebrow mb-3.5">WORK</div>
        <h1 className="serif-display text-[32px] md:text-[44px] leading-[1.05] mb-4">
          Three projects.
          <br />
          Three different problems.
        </h1>
        <p className="text-[13px] md:text-[14px] text-[var(--color-ink-soft)] leading-[1.6] mb-8 md:max-w-[540px]">
          Each one a real piece of infrastructure I built end-to-end. Click through for the
          numbers, the stack, and what got handed off.
        </p>

        <div className="flex flex-col gap-2">
          {caseStudies.map((cs) => (
            <Link
              key={cs.slug}
              href={`/work/${cs.slug}`}
              className={`${cs.gradientClass} block rounded-lg p-4 md:p-5 text-[var(--color-cream)] hover:scale-[1.005] transition-transform`}
            >
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
      </main>
      <Footer />
    </>
  );
}
