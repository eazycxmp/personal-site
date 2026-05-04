import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { MazeGame } from "@/components/maze-game";
import Link from "next/link";

export const metadata = { title: "Maze Run — Espen Campbell" };

export default function RunPage() {
  return (
    <>
      <Nav />
      <main className="max-w-screen-xl mx-auto px-5 md:px-8 pt-12 md:pt-16 pb-16">
        <div className="mb-10">
          <Link
            href="/play"
            className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider hover:text-[var(--color-ink)] transition-colors"
          >
            ← Play
          </Link>
          <h1 className="serif-display text-[44px] md:text-[56px] leading-[1.05] mt-6 mb-4">
            Maze Run
          </h1>
          <p className="text-[14px] text-[var(--color-muted)] max-w-2xl leading-relaxed">
            Use arrow keys or WASD on desktop. Tap directions on mobile. Speed increases every level. Don&apos;t hit the walls.
          </p>
        </div>
        <MazeGame />
      </main>
      <Footer />
    </>
  );
}
