import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { RiverFeastFrame } from "@/components/river-feast-frame";
import Link from "next/link";

export const metadata = { title: "River Feast — Espen Campbell" };

export default function RiverFeastPage() {
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
            River Feast
          </h1>
          <p className="text-[14px] text-[var(--color-muted)] max-w-2xl leading-relaxed">
            Start with a campfire by the river: catch fish, cook them and carry the stack on your
            back to the travelers at your table. Stand on a tile to use it. Cash from every meal
            unlocks the next part of the map: helpers, a quarry and iron mine, farmlands, a market
            quarter with a library for research, boats on the river, and military grounds where
            soldiers train for five campaigns. Keep everyone fed or they get angry. Drag to walk on a
            phone, or use WASD. Progress saves in your browser.
          </p>
        </div>
        <RiverFeastFrame />
      </main>
      <Footer />
    </>
  );
}
