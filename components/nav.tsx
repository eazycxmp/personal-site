"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { siteConfig } from "@/lib/site-config";

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="border-b border-[var(--color-line)] bg-[var(--color-cream)]/95 backdrop-blur sticky top-0 z-40">
      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between px-7 py-4 max-w-screen-xl mx-auto">
        <Link href="/" className="text-[14px] font-medium tracking-tight">
          {siteConfig.name}
        </Link>
        <div className="flex items-center gap-6 text-[13px]">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive(item.href)
                  ? "text-[var(--color-ink)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
              }
            >
              {item.label}
            </Link>
          ))}
          <TrackToggle />
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex items-center justify-between px-4 py-3.5">
        <Link href="/" className="text-[14px] font-medium tracking-tight">
          {siteConfig.name}
        </Link>
        <div className="flex items-center gap-3">
          <TrackToggle />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex flex-col gap-[3px] p-2 -mr-2"
          >
            <span className="w-4 h-px bg-[var(--color-ink)]" />
            <span className="w-4 h-px bg-[var(--color-ink)]" />
            <span className="w-4 h-px bg-[var(--color-ink)]" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-[var(--color-line)] px-4 py-3 flex flex-col gap-2">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`text-[15px] py-2 ${
                isActive(item.href)
                  ? "text-[var(--color-ink)]"
                  : "text-[var(--color-muted)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

function TrackToggle() {
  // GTM is the active track on this domain. Studio toggles to /studio (placeholder for now).
  return (
    <div
      className="flex items-center bg-black/[0.06] rounded-full p-[3px] gap-[2px]"
      role="tablist"
      aria-label="Track switcher"
    >
      <span className="text-[11px] px-[10px] py-1 bg-[var(--color-ink)] text-[var(--color-cream)] rounded-full font-medium">
        GTM
      </span>
      <Link
        href={siteConfig.studioPath}
        className="text-[11px] px-[10px] py-1 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
      >
        Studio
      </Link>
    </div>
  );
}
