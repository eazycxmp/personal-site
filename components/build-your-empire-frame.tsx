"use client";

import { useEffect, useRef, useState } from "react";

/* Build Your Empire is a self-contained canvas page in /public/build-your-empire, framed the
   same way as the blackjack trainer. It posts its content height so the frame
   grows with it and never nests a scrollbar. */
export function BuildYourEmpireFrame() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(820);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    // On a wide screen the game is a wide, short view (about 2:1, at most 72% of the window's height); the
    // ⛶ button in the game takes it to the whole screen. On a phone the game reports its own height (a 3:4
    // view) and the frame follows it.
    const wide = () => (frameRef.current?.clientWidth ?? 0) > 700;
    function fit() {
      const w = frameRef.current?.clientWidth ?? 0;
      if (wide()) setHeight(Math.round(Math.max(460, Math.min(window.innerHeight*.72, w/2))));
    }
    function onMessage(event: MessageEvent) {
      if (event.source !== frameRef.current?.contentWindow) return;
      // the game's ⛶ button where the browser refuses real full screen: the frame covers the whole window
      const fillMsg = (event.data as { rfFill?: unknown } | null)?.rfFill;
      if (typeof fillMsg === "boolean") { setFilled(fillMsg); return; }
      if (wide()) return;
      const next = (event.data as { rfHeight?: unknown } | null)?.rfHeight;
      if (typeof next !== "number" || !Number.isFinite(next)) return;
      setHeight(Math.min(Math.max(next, 400), 2400));
    }
    fit();
    // the frame's width is not known until it is laid out: measure again whenever it changes size
    const ro = new ResizeObserver(fit);
    if (frameRef.current) ro.observe(frameRef.current);
    window.addEventListener("resize", fit);
    window.addEventListener("message", onMessage);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
      window.removeEventListener("message", onMessage);
    };
  }, []);

  return (
    <iframe
      ref={frameRef}
      src="/build-your-empire/index.html"
      title="Build Your Empire"
      allow="fullscreen"
      allowFullScreen
      style={filled ? { position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 1000, borderRadius: 0 } : { height }}
      className="w-full block rounded-lg border border-[var(--color-border)] bg-[#1c1814]"
    />
  );
}
