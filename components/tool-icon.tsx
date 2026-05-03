"use client";

import { useState } from "react";

type Props = {
  name: string;
  slug: string | null;
  domain?: string | null;
  iconUrl?: string | null;
};

export function ToolIcon({ name, slug, domain, iconUrl }: Props) {
  const initialStage: "direct" | "simple" | "logo" | "fallback" = iconUrl
    ? "direct"
    : slug
    ? "simple"
    : domain
    ? "logo"
    : "fallback";
  const [stage, setStage] = useState(initialStage);

  return (
    <div className="aspect-square rounded-lg bg-white flex flex-col items-center justify-center gap-2 p-3 hover:scale-105 transition-transform">
      <div className="w-8 h-8 flex items-center justify-center">
        {stage === "direct" && iconUrl && (
          <img
            src={iconUrl}
            alt={name}
            className="w-8 h-8 object-contain"
            onError={() => setStage(slug ? "simple" : domain ? "logo" : "fallback")}
          />
        )}
        {stage === "simple" && slug && (
          <img
            src={`https://cdn.simpleicons.org/${slug}`}
            alt={name}
            className="w-8 h-8 object-contain"
            onError={() => setStage(domain ? "logo" : "fallback")}
          />
        )}
        {stage === "logo" && domain && (
          <img
            src={`https://img.logo.dev/${domain}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ&size=64&format=png`}
            alt={name}
            className="w-8 h-8 object-contain"
            onError={() => setStage("fallback")}
          />
        )}
        {stage === "fallback" && (
          <div className="display-type text-xl font-medium text-[#1a1a1a]">
            {name.charAt(0)}
          </div>
        )}
      </div>
      <p className="font-mono text-[10px] text-center text-[#1a1a1a]/70 uppercase tracking-wider leading-tight">
        {name}
      </p>
    </div>
  );
}