import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { BlackjackTable } from "@/components/blackjack-table";
import Link from "next/link";

export const metadata = { title: "Blackjack — Espen Campbell" };

export default function BlackjackPage() {
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
            Blackjack
          </h1>
          <p className="text-[14px] text-[var(--color-muted)] max-w-2xl leading-relaxed">
            A blackjack table seen from the player&apos;s chair, built to teach the game and the
            Hi-Lo count. Every hand is graded against basic strategy, and the odds you see are
            computed from the exact cards left in the shoe rather than a lookup table. Keyboard:
            H to hit, S to stand, D to double, P to split, space to deal.
          </p>
        </div>
        <BlackjackTable />
      </main>
      <Footer />
    </>
  );
}
