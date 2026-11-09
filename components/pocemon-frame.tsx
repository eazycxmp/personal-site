"use client";

import { useEffect, useRef, useState } from "react";

/* Pocemon is a self-contained 2D canvas page in /public/pocemon, framed like Skyward.
   Its screen is 3:2 plus a help line, so the frame keeps roughly that shape. The ⛶ button asks the
   browser for real full screen. */
const GAME_KEYS = new Set([
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD",
  "KeyZ", "KeyX", "Enter", "Space", "Escape", "Backspace", "ShiftLeft", "ShiftRight",
  "KeyM", "KeyF", "KeyT", "KeyR", "KeyC",
]);

export function PocemonFrame() {
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

  /* Keyboard play without clicking: the game gets the keyboard once it loads, and a game key pressed anywhere
     else on this page (after clicking a link or the full-screen button, say) is handed to the game, which then
     keeps the keyboard. Shortcuts with Cmd/Ctrl/Alt and typing in a text field are left alone. */
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const give = () => frame.focus({ preventScroll: true });
    const onLoad = () => {
      if (document.activeElement === document.body || document.activeElement === null) give();
    };
    frame.addEventListener("load", onLoad);
    if (frame.contentDocument?.readyState === "complete") onLoad();

    function forward(e: KeyboardEvent) {
      if (!frame || !GAME_KEYS.has(e.code) || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const win = frame.contentWindow as (Window & typeof globalThis) | null;
      if (!win) return;
      const r = frame.getBoundingClientRect();
      if (r.bottom < 80 || r.top > window.innerHeight - 80) return; // the game is scrolled out of view
      e.preventDefault();
      if (e.type === "keydown") give();
      win.dispatchEvent(new win.KeyboardEvent(e.type, { code: e.code, key: e.key, bubbles: true, cancelable: true }));
    }
    window.addEventListener("keydown", forward);
    window.addEventListener("keyup", forward);
    return () => {
      frame.removeEventListener("load", onLoad);
      window.removeEventListener("keydown", forward);
      window.removeEventListener("keyup", forward);
    };
  }, []);

  return (
    <div className="relative">
      <iframe
        ref={frameRef}
        src="/pocemon/index.html"
        title="Pocemon"
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
