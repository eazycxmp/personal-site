import { SHARES, shareMetadata } from "../share";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { SkywardFrame } from "@/components/skyward-frame";
import Link from "next/link";

export const metadata = shareMetadata(SHARES["skyward"], "Skyward — Espen Campbell");

export default function SkywardPage() {
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
          <h1 className="serif-display text-[44px] md:text-[56px] leading-[1.05] mt-6 mb-4">Skyward</h1>
          <p className="text-[14px] text-[var(--color-muted)] max-w-2xl leading-relaxed">
            A flight simulator over a mountain valley. Fly an F-16, a P-51 Mustang, an Airbus A380 or
            an Extra stunt plane, take off from the runway or start in the air, and race the twelve-ring
            course for a lap time. Easy controls: arrow keys steer, W and S set speed, and the plane
            levels itself when you let go. C switches to a working cockpit. Click the game first so it
            gets your keyboard; on a phone, use the on-screen stick.
          </p>
        </div>
      </main>
      <div className="mx-auto max-w-[2400px] px-3 md:px-4 pb-16">
        <SkywardFrame />
      </div>
      <Footer />
    </>
  );
}
