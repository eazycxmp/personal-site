"use client";

import { useState } from "react";

export function ToolIcon({ name, slug }: { name: string; slug: string | null }) {
  const [imgError, setImgError] = useState(false);
  const showImage = slug && !imgError;

  return (
    <div className="group aspect-square rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] flex flex-col items-center justify-center gap-3 p-4 hover:border-[var(--color-fg)] hover:-translate-y-1 transition-all duration-300">
      <div className="w-10 h-10 flex items-center justify-center">
        {showImage ? (
          <img
            src={`https://cdn.simpleicons.org/${slug}`}
            alt={name}
            className="w-10 h-10 object-contain dark:invert opacity-80 group-hover:opacity-100 transition-opacity"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="display-type text-2xl font-medium opacity-60 group-hover:opacity-100 transition-opacity">
            {name.charAt(0)}
          </div>
        )}
      </div>
      <p className="font-mono text-xs text-center text-[var(--color-muted)] group-hover:text-[var(--color-fg)] transition-colors uppercase tracking-wider">
        {name}
      </p>
    </div>
  );
}
