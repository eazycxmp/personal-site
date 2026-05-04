import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-line)] mt-12">
      <div className="max-w-screen-xl mx-auto px-7 py-6 flex flex-col md:flex-row md:justify-between gap-2 text-[12px] text-[var(--color-muted)]">
        <span>Espen Campbell · {new Date().getFullYear()}</span>
        <div className="flex gap-4">
          <a
            href={siteConfig.socials.github}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--color-ink)] transition-colors"
          >
            GitHub
          </a>
          <a
            href={siteConfig.socials.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--color-ink)] transition-colors"
          >
            LinkedIn
          </a>
          <a
            href={siteConfig.socials.email}
            className="hover:text-[var(--color-ink)] transition-colors"
          >
            Email
          </a>
        </div>
      </div>
    </footer>
  );
}
