"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { siteConfig } from "@/lib/site-config";

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isStudio = pathname.startsWith("/studio");

  const navItems = isStudio ? siteConfig.studioNav : siteConfig.nav;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="border-b border-[var(--color-line)] bg-[var(--color-cream)]/95 backdrop-blur sticky top-0 z-40">
      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between px-7 py-4 max-w-screen-xl mx-auto">
        <Link href={isStudio ? "/studio" : "/"} className="text-[14px] font-medium tracking-tight">
          {siteConfig.name}
        </Link>
        <div className="flex items-center gap-6 text-[13px]">
          {navItems.map((item) => (
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
          <TrackToggle isStudio={isStudio} />
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex items-center justify-between px-4 py-3.5">
        <Link href={isStudio ? "/studio" : "/"} className="text-[14px] font-medium tracking-tight">
          {siteConfig.name}
        </Link>
        <div className="flex items-center gap-3">
          <TrackToggle isStudio={isStudio} />
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
          {navItems.map((item) => (
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

function TrackToggle({ isStudio }: { isStudio: boolean }) {
  return (
    <div
      className="flex items-center bg-black/[0.06] rounded-full p-[3px] gap-[2px]"
      role="tablist"
      aria-label="Track switcher"
    >
      <Link
        href="/"
        className={`text-[11px] px-[10px] py-1 rounded-full font-medium transition-colors ${
          !isStudio
            ? "bg-[var(--color-ink)] text-[var(--color-cream)]"
            : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        }`}
      >
        GTM
      </Link>
      <Link
        href={siteConfig.studioPath}
        className={`text-[11px] px-[10px] py-1 rounded-full font-medium transition-colors ${
          isStudio
            ? "bg-[var(--color-ink)] text-[var(--color-cream)]"
            : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        }`}
      >
        Studio
      </Link>
    </div>
  );
}
