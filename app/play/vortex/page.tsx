import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { PitchClient } from "@/components/vortex/pitch-client";
import Link from "next/link";

export const metadata = { title: "Vortex Rugby — Espen Campbell" };

export default function VortexPage() {
  return (
    <>
      <Nav />
      <main className="max-w-screen-xl mx-auto px-5 md:px-8 pt-12 md:pt-10 pb-6">
        <Link
          href="/play"
          className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider hover:text-[var(--color-ink)] transition-colors"
        >
          ← Play
        </Link>
      </main>
      <PitchClient />
      <Footer />
    </>
  );
}
