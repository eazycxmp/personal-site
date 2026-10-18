import { ImageResponse } from "next/og";
import type { Metadata } from "next";

/* Share previews for the Play pages: playful cards, not the consulting pitch from the root layout. */
export type Share = { emoji: string; title: string; line: string; from: string; to: string; path: string };

export const SHARES = {
  play: { emoji: "🕹️", title: "Espen's Arcade", line: "Little browser games I build for fun. Pick one and play, no download.", from: "#ff9a3c", to: "#ff4f8b", path: "/play" },
  vortex: { emoji: "🏉", title: "Vortex Rugby", line: "Catch the up-and-under, beat the line and dive for the try.", from: "#1f6feb", to: "#14b88a", path: "/play/vortex" },
  blackjack: { emoji: "🃏", title: "Blackjack", line: "Beat the dealer, learn to count cards, and a coach grades every move.", from: "#0f7a3a", to: "#2bb36b", path: "/play/blackjack" },
  "build-your-empire": { emoji: "🏰", title: "Build Your Empire", line: "One campfire, one fish. Grow it into castles, trains, air strikes and a trip to the Moon.", from: "#f2a51a", to: "#d9443a", path: "/play/build-your-empire" },
  run: { emoji: "🌀", title: "Maze Run", line: "It keeps getting faster. How long can you last?", from: "#7c4fb0", to: "#3f7cc0", path: "/play/run" },
  paint: { emoji: "🐶", title: "Paint the Pup", line: "Grab a color and finger-paint a very good dog.", from: "#ffb8d0", to: "#8fd0ff", path: "/play/paint" },
  skyward: { emoji: "✈️", title: "Skyward", line: "Fly an F-16, a Mustang, an A380 or a stunt plane through a mountain valley.", from: "#3a78c6", to: "#ffb547", path: "/play/skyward" },
} satisfies Record<string, Share>;

export const ogSize = { width: 1200, height: 630 };

export function shareMetadata(s: Share, pageTitle: string): Metadata {
  const description = s.line;
  return {
    title: pageTitle,
    description,
    openGraph: { title: `${s.emoji} ${s.title}`, description, url: `https://espencampbell.com${s.path}`, siteName: "Espen's Arcade", type: "website", locale: "en_US" },
    twitter: { card: "summary_large_image", title: `${s.emoji} ${s.title}`, description },
  };
}

export function shareCard(s: Share) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64,
        background: `linear-gradient(135deg, ${s.from}, ${s.to})`, color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <div style={{ fontSize: 200, lineHeight: 1 }}>{s.emoji}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 760 }}>
            <div style={{ fontSize: 84, fontWeight: 900, lineHeight: 1.02, textShadow: "0 4px 0 rgba(0,0,0,.18)" }}>{s.title}</div>
            <div style={{ fontSize: 36, fontWeight: 600, lineHeight: 1.25, opacity: 0.95 }}>{s.line}</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 30, fontWeight: 700 }}>
          <div style={{ display: "flex", background: "rgba(255,255,255,.22)", borderRadius: 999, padding: "12px 28px" }}>▶ Play free in your browser</div>
          <div style={{ display: "flex", opacity: 0.9 }}>espencampbell.com{s.path}</div>
        </div>
      </div>
    ),
    { ...ogSize, emoji: "twemoji" },
  );
}
