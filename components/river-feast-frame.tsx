"use client";

import { useEffect, useRef, useState } from "react";

/* River Feast is a self-contained canvas page in /public/river-feast, framed the
   same way as the blackjack trainer. It posts its content height so the frame
   grows with it and never nests a scrollbar. */
export function RiverFeastFrame() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(820);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== frameRef.current?.contentWindow) return;
      const next = (event.data as { rfHeight?: unknown } | null)?.rfHeight;
      if (typeof next !== "number" || !Number.isFinite(next)) return;
      setHeight(Math.min(Math.max(next, 400), 2400));
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={frameRef}
      src="/river-feast/index.html"
      title="River Feast"
      style={{ height }}
      className="w-full block rounded-lg border border-[var(--color-border)] bg-[#1c1814]"
    />
  );
}
