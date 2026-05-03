import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const navLink = "relative text-sm hover:opacity-90 after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:h-px after:w-0 after:bg-[var(--color-fg)] after:transition-all after:duration-300 hover:after:w-full";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--color-bg)]/70 border-b border-[var(--color-border)]">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-medium tracking-tight hover:opacity-70 transition-opacity">Espen Campbell</Link>
        <nav className="flex items-center gap-6">
          <Link href="/" className={navLink}>Home</Link>
          <Link href="/work" className={navLink}>Work</Link>
          <Link href="/stack" className={navLink}>Stack</Link>
          <Link href="/studio" className={navLink}>Studio</Link>
          <Link href="/play" className={navLink}>Play</Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
