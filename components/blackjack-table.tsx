"use client";

import { useEffect, useRef, useState } from "react";

/* The blackjack trainer is a self-contained page in /public/blackjack. Framing it
   keeps that file the single source of truth instead of forking the game into
   React. It posts its own height up so the frame grows and we never stack a
   scrollbar inside a scrollbar. */
export function BlackjackTable() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(1180);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      // only trust our own frame, and only a sane number
      if (event.source !== frameRef.current?.contentWindow) return;
      const next = (event.data as { bjHeight?: unknown } | null)?.bjHeight;
      if (typeof next !== "number" || !Number.isFinite(next)) return;
      setHeight(Math.min(Math.max(next, 600), 4000));
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={frameRef}
      src="/blackjack/index.html"
      title="Blackjack trainer"
      style={{ height }}
      className="w-full block rounded-lg border border-[var(--color-border)] bg-[#070b09]"
    />
  );
}
