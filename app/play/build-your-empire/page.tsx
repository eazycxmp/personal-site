import { SHARES, shareMetadata } from "../share";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { BuildYourEmpireFrame } from "@/components/build-your-empire-frame";
import Link from "next/link";

export const metadata = shareMetadata(SHARES["build-your-empire"], "Build Your Empire — Espen Campbell");

export default function BuildYourEmpirePage() {
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
          <h1 className="serif-display text-[44px] md:text-[56px] leading-[1.05] mt-6 mb-4">
            Build Your Empire
          </h1>
          <p className="text-[14px] text-[var(--color-muted)] max-w-2xl leading-relaxed">
            Start with a campfire by the river: catch fish, cook them and carry the stack on your
            back to the travelers at your table. Stand on a tile to use it. Cash from every meal
            unlocks the next part of the map: helpers, a quarry and iron mine, farmlands, a market
            quarter with a library for research, a brewery and beer garden, boats on the river,
            military grounds where soldiers train for five campaigns, and a downtown where townhouses
            grow into skyscrapers. Upgrade every building, chase goals, and keep everyone fed or they
            get angry. Drag to walk on a phone, or use WASD. Progress saves in your browser.
          </p>
        </div>
      </main>
      {/* the game gets nearly the whole screen on a computer; on a phone it keeps its usual size */}
      <div className="mx-auto max-w-[1920px] px-5 md:px-6 pb-16">
        <BuildYourEmpireFrame />
      </div>
      <Footer />
    </>
  );
}
