import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export const metadata = { title: "Studio — Espen Campbell" };

export default function StudioPlaceholder() {
  return (
    <>
      <Nav />
      <main className="max-w-screen-xl mx-auto px-5 md:px-8 pt-12 md:pt-16 pb-9 min-h-[60vh]">
        <div className="label-eyebrow mb-3.5">STUDIO</div>
        <h1 className="serif-display text-[32px] md:text-[44px] leading-[1.05] mb-4">
          Films, photo,
          <br />
          and Vortex Rugby.
        </h1>
        <p className="text-[13px] md:text-[14px] text-[var(--color-ink-soft)] leading-[1.6] md:max-w-[540px]">
          The Studio side is coming. Hybrid athlete content, a film reel, and the Vortex Rugby
          brand. Toggle back to GTM in the nav above.
        </p>
      </main>
      <Footer />
    </>
  );
}
