import Image from "next/image";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export const metadata = { title: "Studio — Espen Campbell" };

const PROJECTS = [
  {
    n: "01",
    title: "Vortex Rugby",
    tag: "Brand · Identity",
    body: "Full brand system for a performance rugby club. Wordmark, kit design, and motion guidelines built from scratch.",
    href: "#",
  },
  {
    n: "02",
    title: "Season Reel",
    tag: "Film · Edit",
    body: "Short-form highlight series shot and cut through a full competitive season. Built to run on socials.",
    href: "#",
  },
  {
    n: "03",
    title: "Athlete Series",
    tag: "Photo · Content",
    body: "Portrait and action series documenting individual athletes. Black and white editorial style.",
    href: "#",
  },
];

export default function StudioPage() {
  return (
    <>
      <Nav />
      <main className="max-w-screen-xl mx-auto px-5 md:px-8 pt-12 md:pt-16 pb-16">
        {/* Hero */}
        <section className="mb-16 md:mb-20 grid md:grid-cols-[1fr_auto] gap-8 items-end">
          <div>
            <div className="label-eyebrow mb-4">VORTEX UNLIMITED</div>
            <h1 className="serif-display text-[40px] md:text-[64px] leading-[1.02] mb-5">
              Film, photo,
              <br />
              and design.
            </h1>
            <p className="text-[13px] md:text-[14px] text-[var(--color-ink-soft)] leading-[1.65] max-w-[480px]">
              Creative work outside of GTM — rugby, sport, and athlete content. Shot, edited, and
              built by hand.
            </p>
          </div>
          <div className="hidden md:block opacity-60">
            <Image
              src="/vortex-logo-white.png"
              alt="Vortex Rugby"
              width={72}
              height={72}
              className="object-contain"
            />
          </div>
        </section>

        {/* Projects */}
        <section>
          <div className="flex items-baseline justify-between mb-5 border-b border-[var(--color-line)] pb-3">
            <h2 className="label-eyebrow">PROJECTS</h2>
            <span className="label-eyebrow">{PROJECTS.length} WORKS</span>
          </div>

          <div className="flex flex-col gap-3">
            {PROJECTS.map((p) => (
              <Link
                key={p.n}
                href={p.href}
                className="group block border border-[var(--color-line-strong)] bg-[var(--color-card)] rounded-xl p-6 md:p-8 hover:border-[rgba(255,255,255,0.28)] transition-all duration-300"
              >
                <div className="md:grid md:grid-cols-[60px_1fr_2fr_60px] md:gap-6 md:items-start">
                  <div className="serif-display text-[32px] text-[var(--color-muted)] leading-none mb-3 md:mb-0">
                    {p.n}
                  </div>
                  <div className="mb-2 md:mb-0">
                    <div className="label-eyebrow mb-1.5">{p.tag}</div>
                    <div className="serif-display text-[20px] md:text-[22px]">{p.title}</div>
                  </div>
                  <div className="text-[13px] text-[var(--color-ink-soft)] leading-[1.6] md:pr-4">
                    {p.body}
                  </div>
                  <div className="text-[var(--color-muted)] group-hover:text-[var(--color-ink)] transition-colors text-[13px] text-right mt-3 md:mt-0">
                    View →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
