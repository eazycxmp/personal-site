import { SHARES, shareMetadata } from "../share";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { PocemonFrame } from "@/components/pocemon-frame";
import Link from "next/link";

export const metadata = shareMetadata(SHARES["pocemon"], "Pocemon — Espen Campbell");

export default function PocemonPage() {
  return (
    <>
      <Nav />
      <main className="max-w-screen-xl mx-auto px-5 md:px-8 pt-12 md:pt-16 pb-0">
        <div className="mb-10">
          <Link
            href="/play"
            className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider hover:text-[var(--color-ink)] transition-colors"
          >
            ← Play
          </Link>
          <h1 className="serif-display text-[44px] md:text-[56px] leading-[1.05] mt-6 mb-4">Pocemon</h1>
          <p className="text-[14px] text-[var(--color-muted)] max-w-2xl leading-relaxed">
            A top-down pocemon-catching adventure. Pick a starter, walk into the tall grass to battle and catch
            over 200 strange creatures, beat eight gyms and challenge the Champion, all to a live drum &amp; bass
            soundtrack. The arrow keys walk, SHIFT runs, Z talks and confirms, X opens the menu.
            Click the game first so it gets your keyboard.{" "}
            <a href="/pocemon/CREDITS.md" className="underline">Art credits</a>.
          </p>
        </div>
      </main>
      <div className="mx-auto max-w-[2400px] px-3 md:px-4 pb-16">
        <PocemonFrame />
      </div>
      <Footer />
    </>
  );
}
