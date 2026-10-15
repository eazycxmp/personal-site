"use client";

import { useEffect, useRef, useState } from "react";

/* Build Your Empire is a self-contained canvas page in /public/build-your-empire, framed the
   same way as the blackjack trainer. It posts its content height so the frame
   grows with it and never nests a scrollbar. */
export function BuildYourEmpireFrame() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(820);

  useEffect(() => {
    // On a wide screen the frame fills the window's height and the game fills the frame, so you see more
    // of the map. On a phone the game reports its own height (a 3:4 view) and the frame follows it.
    const wide = () => (frameRef.current?.clientWidth ?? 0) > 700;
    function fit() {
      if (wide()) setHeight(Math.max(560, window.innerHeight - 24));
    }
    function onMessage(event: MessageEvent) {
      if (event.source !== frameRef.current?.contentWindow || wide()) return;
      const next = (event.data as { rfHeight?: unknown } | null)?.rfHeight;
      if (typeof next !== "number" || !Number.isFinite(next)) return;
      setHeight(Math.min(Math.max(next, 400), 2400));
    }
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("message", onMessage);
    };
  }, []);

  return (
    <iframe
      ref={frameRef}
      src="/build-your-empire/index.html"
      title="Build Your Empire"
      style={{ height }}
      className="w-full block rounded-lg border border-[var(--color-border)] bg-[#1c1814]"
    />
  );
}
