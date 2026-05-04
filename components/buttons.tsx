import Link from "next/link";
import { ReactNode } from "react";

type ButtonProps = {
  href: string;
  children: ReactNode;
  external?: boolean;
  className?: string;
};

export function ButtonPrimary({ href, children, external, className = "" }: ButtonProps) {
  const cls = `inline-flex items-center justify-center bg-[var(--color-ink)] text-[var(--color-cream)] px-[18px] py-[10px] rounded-full text-[12px] font-medium hover:bg-black transition-colors ${className}`;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function ButtonSecondary({ href, children, external, className = "" }: ButtonProps) {
  const cls = `inline-flex items-center justify-center bg-transparent text-[var(--color-ink)] border border-[var(--color-ink)] px-[18px] py-[10px] rounded-full text-[12px] hover:bg-[var(--color-ink)] hover:text-[var(--color-cream)] transition-colors ${className}`;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
