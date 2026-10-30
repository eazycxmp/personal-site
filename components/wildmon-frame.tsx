"use client";

import { useEffect, useRef, useState } from "react";

/* Wildmon is a self-contained three.js page in /public/wildmon, framed like Skyward.
   Its screen is 3:2 plus a help line, so the frame keeps roughly that shape. The ⛶ button asks the
   browser for real full screen. */
export function WildmonFrame() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(640);

  useEffect(() => {
    function fit() {
      const w = frameRef.current?.clientWidth ?? 0;
      const h = w > 700 ? Math.min(window.innerHeight * 0.85, w * 0.72) : window.innerHeight * 0.8;
      setHeight(Math.round(Math.max(420, h)));
    }
    fit();
    const ro = new ResizeObserver(fit);
    if (frameRef.current) ro.observe(frameRef.current);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);

  return (
    <div className="relative">
      <iframe
        ref={frameRef}
        src="/wildmon/index.html"
        title="Wildmon"
        allow="fullscreen; autoplay"
        allowFullScreen
        style={{ height }}
        className="w-full block rounded-lg border border-[var(--color-border)] bg-[#0c120c]"
      />
      <button
        type="button"
        onClick={() => frameRef.current?.requestFullscreen?.().catch(() => {})}
        className="absolute bottom-3 right-3 font-mono text-xs uppercase tracking-wider rounded-md bg-black/60 text-white px-3 py-1.5 hover:bg-black/80"
      >
        ⛶ Full screen
      </button>
    </div>
  );
}
