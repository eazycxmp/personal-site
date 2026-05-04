import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import Link from "next/link";

export const metadata = { title: "Play — Espen Campbell" };

const GAMES = [
  {
    slug: "run",
    title: "Maze Run",
    tag: "Reflex · Speed",
    body: "A small dot runs through a maze. Speed increases the longer you survive. Get hit by a wall and it's over. Beat the high score.",
    status: "Live",
  },
];

export default function PlayPage() {
  return (
    <>
      <Nav />
      <main className="max-w-screen-xl mx-auto px-5 md:px-8 pt-12 md:pt-16 pb-16">
        <div className="mb-16">
          <div className="label-eyebrow mb-3.5">INTERACTIVE SANDBOX</div>
          <h1 className="serif-display text-[44px] md:text-[64px] leading-[1.05] mb-4">Play</h1>
          <p className="text-[14px] text-[var(--color-muted)] max-w-2xl leading-relaxed">
            Small interactive things I&apos;ve built. Less business, more fun. Click through.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {GAMES.map((game) => (
            <Link
              key={game.slug}
              href={`/play/${game.slug}`}
              className="group block p-8 rounded-xl border border-[var(--color-line-strong)] bg-white hover:border-[var(--color-ink)] hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-baseline justify-between mb-4">
                <p className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider">{game.tag}</p>
                <span className="font-mono text-xs text-[var(--color-accent)] uppercase tracking-wider">{game.status}</span>
              </div>
              <h2 className="serif-display text-3xl mb-3">{game.title}</h2>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed mb-6">{game.body}</p>
              <span className="inline-flex items-center gap-1 text-sm font-medium">Play →</span>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
