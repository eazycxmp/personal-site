"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

// three.js touches window and WebGL on mount, so this never renders on the server
const EnterThePitch = dynamic(() => import("./EnterThePitch"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh] bg-[#0A0D0A]">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#C9A227]">
        Loading the pitch…
      </span>
    </div>
  ),
});

/* Embedded, the pitch fills its frame exactly, so it never scrolls itself — and
   a browser will not chain a scroll from a cross-origin iframe out to the page
   holding it. A finger swiped up over the game therefore moved nothing at all.
   Forward the vertical part of the gesture to the host, which scrolls for us.
   Horizontal drags are left alone: those are steering. */
function useScrollBridge(active: boolean) {
  useEffect(() => {
    if (!active || typeof window === "undefined" || window.parent === window) return;
    let lastY = 0;
    let lastX = 0;
    const start = (e: TouchEvent) => {
      lastY = e.touches[0].clientY;
      lastX = e.touches[0].clientX;
    };
    const move = (e: TouchEvent) => {
      const { clientY: y, clientX: x } = e.touches[0];
      const dy = lastY - y;
      const dx = lastX - x;
      lastY = y;
      lastX = x;
      if (Math.abs(dy) > Math.abs(dx)) {
        window.parent.postMessage({ type: "vortex:scroll", dy }, "*");
      }
    };
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchmove", move, { passive: true });
    return () => {
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchmove", move);
    };
  }, [active]);
}

/* Tell the host how tall we actually are, so the frame can hug the pitch. A
   fixed frame height leaves dark bands above and below when the content is
   shorter, and clips the Kick Off button when it is taller — and the right
   height differs per device, so only the embed can know it. */
function useHeightReporter(active: boolean) {
  useEffect(() => {
    if (!active || typeof window === "undefined" || window.parent === window) return;
    let last = 0;
    const report = () => {
      const h = Math.ceil(document.documentElement.getBoundingClientRect().height);
      if (h && h !== last) {
        last = h;
        window.parent.postMessage({ type: "vortex:height", height: h }, "*");
      }
    };
    report();
    const ro = new ResizeObserver(report);
    ro.observe(document.documentElement);
    window.addEventListener("resize", report);
    const t = setInterval(report, 1000); // the canvas settles after the models land
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", report);
      clearInterval(t);
    };
  }, [active]);
}

export function PitchClient({ bare = false }: { bare?: boolean }) {
  useScrollBridge(bare);
  useHeightReporter(bare);
  return <EnterThePitch bare={bare} />;
}
