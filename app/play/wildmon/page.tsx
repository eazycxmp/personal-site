import { SHARES, shareMetadata } from "../share";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { MonsterTrailsFrame } from "@/components/monster-trails-frame";
import Link from "next/link";

export const metadata = shareMetadata(SHARES["monster-trails"], "Monster Trails — Espen Campbell");

export default function MonsterTrailsPage() {
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
          <h1 className="serif-display text-[44px] md:text-[56px] leading-[1.05] mt-6 mb-4">Monster Trails</h1>
          <p className="text-[14px] text-[var(--color-muted)] max-w-2xl leading-relaxed">
            A 3D monster-catching adventure. Pick a starter, walk into the tall grass to battle and catch
            over 200 strange creatures, beat four gyms and challenge the Champion, all to a live drum &amp; bass
            soundtrack. UP walks, LEFT and RIGHT steer, SHIFT runs, Z talks and confirms, X opens the menu.
            Click the game first so it gets your keyboard. Art from the open-source Tuxemon project and
            Kenney; credits are in the game folder.
          </p>
        </div>
      </main>
      <div className="mx-auto max-w-[2400px] px-3 md:px-4 pb-16">
        <MonsterTrailsFrame />
      </div>
      <Footer />
    </>
  );
}
