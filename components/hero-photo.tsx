"use client";
import Image from "next/image";

export function HeroPhoto() {
  return (
    <div className="hero-pull-enter w-full h-full relative">
      <Image
        src="/espen-profile.png"
        alt="Espen Campbell"
        fill
        className="object-cover object-top"
        priority
      />
      {/* Bottom fade so the photo blends into the page */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--color-cream)] to-transparent pointer-events-none" />
    </div>
  );
}
