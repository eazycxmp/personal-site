import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="max-w-screen-xl mx-auto px-5 md:px-8 pt-12 md:pt-16 pb-9 min-h-[60vh]">
        <div className="label-eyebrow mb-3.5">404</div>
        <h1 className="serif-display text-[32px] md:text-[44px] leading-[1.05] mb-4">
          Lost in the funnel.
        </h1>
        <p className="text-[13px] md:text-[14px] text-[var(--color-ink-soft)] leading-[1.6] mb-6">
          That page doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-block bg-[var(--color-ink)] text-[var(--color-cream)] px-[18px] py-2.5 rounded-full text-[12px] font-medium"
        >
          Back home →
        </Link>
      </main>
      <Footer />
    </>
  );
}
