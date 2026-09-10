import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { DogPaint } from "@/components/dog-paint";
import Link from "next/link";

export const metadata = { title: "Paint the Pup — Espen Campbell" };

export default function PaintPage() {
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
            Paint the Pup
          </h1>
          <p className="text-[14px] text-[var(--color-muted)] max-w-2xl leading-relaxed">
            A simple white coloring page. Tap a part of the puppy for a color
            suggestion, then drag your finger to draw. The paint stays inside
            that panel.
          </p>
        </div>
        <DogPaint />
      </main>
      <Footer />
    </>
  );
}
