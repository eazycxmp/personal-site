"use client";

import Link from "next/link";
import { motion } from "motion/react";

const lineVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export function HeroReveal() {
  return (
    <section className="mb-20 md:mb-28 pt-8">
      <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-end">
        <div className="md:col-span-8">
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={lineVariants}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="display-type text-6xl md:text-8xl font-medium mb-8 max-w-[18ch]"
          >
            GTM systems<br />with <span className="italic" style={{ fontVariationSettings: "'SOFT' 100, 'WONK' 1" }}>craft.</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={lineVariants}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-xl text-[var(--color-muted)] max-w-xl leading-relaxed mb-10"
          >
            I build custom outbound and RevOps infrastructure for B2B SaaS — n8n, Clay, HubSpot, AI personalization. With the same care I bring to film.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={lineVariants}
            transition={{ duration: 0.5, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap gap-4"
          >
            <Link href="/work" className="group inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-fg)] text-[var(--color-bg)] rounded-full text-sm font-medium hover:bg-[var(--color-accent)] transition-colors">
              See the work
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <a href="mailto:espen@espencampbell.com" className="inline-flex items-center gap-2 px-6 py-3 border border-[var(--color-fg)] rounded-full text-sm font-medium hover:bg-[var(--color-fg)] hover:text-[var(--color-bg)] transition-colors">
              Get in touch
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-4 aspect-[4/5] rounded-lg overflow-hidden bg-[var(--color-fg)] relative"
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/portrait.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "grayscale(0.2) contrast(1.05)",
            }}
          />
          <div className="absolute inset-0 flex items-end p-6 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
            <div className="text-white space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-widest opacity-70">GTM builder</p>
              <p className="font-mono text-[10px] uppercase tracking-widest opacity-70">Filmmaker</p>
              <p className="font-mono text-[10px] uppercase tracking-widest opacity-70">Hybrid athlete</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
