"use client";

import Link from "next/link";
import { motion } from "motion/react";

export function WorkCard({ href, tag, title, body, number }: { href: string; tag: string; title: string; body: string; number: string }) {
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
      <Link href={href} className="group block h-full p-7 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-fg)] transition-colors relative overflow-hidden">
        <div className="flex items-start justify-between mb-8">
          <p className="text-xs text-[var(--color-muted)] font-mono uppercase tracking-wider">{tag}</p>
          <span className="font-mono text-xs text-[var(--color-muted)] group-hover:text-[var(--color-accent)] transition-colors">{number}</span>
        </div>
        <h3 className="display-type text-2xl font-medium mb-3 leading-tight">{title}</h3>
        <p className="text-sm text-[var(--color-muted)] leading-relaxed">{body}</p>
        <div className="mt-6 inline-flex items-center gap-1 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Read more <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </div>
      </Link>
    </motion.div>
  );
}
