"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PanelId =
  | "leftEar"
  | "rightEar"
  | "leftInnerEar"
  | "rightInnerEar"
  | "forehead"
  | "leftCheek"
  | "rightCheek"
  | "muzzle"
  | "nose"
  | "chest"
  | "saddle"
  | "belly"
  | "leftLeg"
  | "rightLeg"
  | "tail";

type Panel = {
  id: PanelId;
  label: string;
  d: string;
  shade: string;
};

const PANELS: Panel[] = [
  {
    id: "tail",
    label: "Tail",
    shade: "#7A624C",
    d: "M92 308C22 278 2 332 18 384C30 418 78 400 112 348C122 324 114 312 92 308Z",
  },
  {
    id: "saddle",
    label: "Back",
    shade: "#6B5340",
    d: "M98 262C68 286 64 344 88 390L140 362C148 322 154 290 166 268H234C246 290 252 322 260 362L312 390C336 344 332 286 302 262C256 234 144 234 98 262Z",
  },
  {
    id: "belly",
    label: "Belly",
    shade: "#D2BFA8",
    d: "M122 358C104 388 116 434 154 450C180 460 220 460 246 450C284 434 296 388 278 358C242 378 158 378 122 358Z",
  },
  {
    id: "leftLeg",
    label: "Left paw",
    shade: "#B08968",
    d: "M116 396C98 418 96 464 110 482C122 496 164 498 176 478C186 462 178 424 164 402C148 386 130 386 116 396Z",
  },
  {
    id: "rightLeg",
    label: "Right paw",
    shade: "#B08968",
    d: "M284 396C302 418 304 464 290 482C278 496 236 498 224 478C214 462 222 424 236 402C252 386 270 386 284 396Z",
  },
  {
    id: "chest",
    label: "Chest",
    shade: "#F4EDE3",
    d: "M166 256C142 280 140 328 164 350C182 364 218 364 236 350C260 328 258 280 234 256C216 244 184 244 166 256Z",
  },
  {
    id: "leftEar",
    label: "Left ear",
    shade: "#6E5A48",
    d: "M128 122C52 128 22 188 38 240C50 274 102 262 130 208C142 176 144 140 128 122Z",
  },
  {
    id: "rightEar",
    label: "Right ear",
    shade: "#6E5A48",
    d: "M272 122C348 128 378 188 362 240C350 274 298 262 270 208C258 176 256 140 272 122Z",
  },
  {
    id: "forehead",
    label: "Forehead",
    shade: "#A38468",
    d: "M122 158C128 80 272 80 278 158C252 176 148 176 122 158Z",
  },
  {
    id: "leftCheek",
    label: "Left cheek",
    shade: "#C9AE94",
    d: "M122 158C94 178 90 232 124 254C146 250 160 222 164 186C150 166 134 158 122 158Z",
  },
  {
    id: "rightCheek",
    label: "Right cheek",
    shade: "#C9AE94",
    d: "M278 158C306 178 310 232 276 254C254 250 240 222 236 186C250 166 266 158 278 158Z",
  },
  {
    id: "muzzle",
    label: "Muzzle",
    shade: "#E8D8C4",
    d: "M164 176C148 196 148 242 176 258C190 266 210 266 224 258C252 242 252 196 236 176C220 164 180 164 164 176Z",
  },
  {
    id: "leftInnerEar",
    label: "Inside left ear",
    shade: "#E0B8A8",
    d: "M120 142C70 150 54 188 64 222C72 242 102 232 122 192C130 172 130 150 120 142Z",
  },
  {
    id: "rightInnerEar",
    label: "Inside right ear",
    shade: "#E0B8A8",
    d: "M280 142C330 150 346 188 336 222C328 242 298 232 278 192C270 172 270 150 280 142Z",
  },
  {
    id: "nose",
    label: "Nose",
    shade: "#3D2A24",
    d: "M180 208C168 216 166 232 184 244C194 252 206 252 216 244C234 232 232 216 220 208C210 200 190 200 180 208Z",
  },
];

const COLORS = [
  { name: "Red", hex: "#E53935" },
  { name: "Orange", hex: "#FB8C00" },
  { name: "Yellow", hex: "#FDD835" },
  { name: "Lime", hex: "#9CCC65" },
  { name: "Green", hex: "#43A047" },
  { name: "Teal", hex: "#26A69A" },
  { name: "Sky", hex: "#4FC3F7" },
  { name: "Blue", hex: "#1E88E5" },
  { name: "Purple", hex: "#8E24AA" },
  { name: "Pink", hex: "#EC407A" },
  { name: "Golden", hex: "#E8B84A" },
  { name: "Caramel", hex: "#C68642" },
  { name: "Brown", hex: "#6D4C41" },
  { name: "Cream", hex: "#F3E6D4" },
  { name: "Black", hex: "#212121" },
  { name: "White", hex: "#FAFAFA" },
] as const;

const STORAGE_KEY = "puppy-paint-v2";

const emptyFills = (): Record<PanelId, string | null> =>
  Object.fromEntries(PANELS.map((panel) => [panel.id, null])) as Record<
    PanelId,
    string | null
  >;

function loadSaved(): Record<PanelId, string | null> {
  if (typeof window === "undefined") return emptyFills();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyFills();
    const parsed = JSON.parse(raw) as Partial<Record<PanelId, string | null>>;
    const next = emptyFills();
    for (const panel of PANELS) {
      const value = parsed[panel.id];
      if (typeof value === "string" || value === null) next[panel.id] = value;
    }
    return next;
  } catch {
    return emptyFills();
  }
}

function panelIdFromPoint(x: number, y: number): PanelId | null {
  const el = document.elementFromPoint(x, y);
  const host = el?.closest("[data-panel]");
  const id = host?.getAttribute("data-panel");
  return id && PANELS.some((panel) => panel.id === id) ? (id as PanelId) : null;
}

export function DogPaint() {
  const paintingRef = useRef(false);
  const fillsRef = useRef<Record<PanelId, string | null>>(emptyFills());
  const [fills, setFills] = useState<Record<PanelId, string | null>>(emptyFills);
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[10].hex);
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const [history, setHistory] = useState<Record<PanelId, string | null>[]>([]);
  const [hydrated, setHydrated] = useState(false);

  fillsRef.current = fills;

  useEffect(() => {
    setFills(loadSaved());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fills));
  }, [fills, hydrated]);

  const remaining = PANELS.filter((panel) => fills[panel.id] === null);
  const paintedCount = PANELS.length - remaining.length;
  const complete = remaining.length === 0;
  const hintUnpainted = remaining.length > 0 && remaining.length <= 5;

  const paint = useCallback(
    (id: PanelId) => {
      setActivePanel(id);
      const prev = fillsRef.current;
      if (prev[id] === selectedColor) return;
      setHistory((h) => [...h.slice(-24), prev]);
      const next = { ...prev, [id]: selectedColor };
      fillsRef.current = next;
      setFills(next);
    },
    [selectedColor]
  );

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    event.preventDefault();
    paintingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    const id = panelIdFromPoint(event.clientX, event.clientY);
    if (id) paint(id);
  };

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!paintingRef.current) return;
    const id = panelIdFromPoint(event.clientX, event.clientY);
    if (id) paint(id);
    else setActivePanel(null);
  };

  const onPointerUp = () => {
    paintingRef.current = false;
    setActivePanel(null);
  };

  const undo = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    fillsRef.current = prev;
    setFills(prev);
  };

  const reset = () => {
    setHistory((h) => [...h, fills]);
    const next = emptyFills();
    fillsRef.current = next;
    setFills(next);
  };

  const activeLabel = PANELS.find((panel) => panel.id === activePanel)?.label;

  return (
    <div className="rounded-2xl border border-[var(--color-line-strong)] bg-white overflow-hidden">
      <div className="px-5 pt-5 pb-2 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-muted)]">
            {paintedCount} / {PANELS.length} panels
          </p>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1 min-h-[1.25rem]">
            {complete
              ? "You painted the whole puppy!"
              : activeLabel
                ? `Painting the ${activeLabel.toLowerCase()}`
                : "Pick a color, then press a part of the dog."}
          </p>
          {!complete && remaining.length > 0 && remaining.length <= 8 ? (
            <p className="text-xs text-[var(--color-muted)] mt-1">
              Still open: {remaining.map((panel) => panel.label).join(", ")}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={undo}
            disabled={history.length === 0}
            className="text-sm px-3 py-1.5 rounded-full border border-[var(--color-line-strong)] disabled:opacity-40 hover:border-[var(--color-ink)] transition-colors"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={reset}
            className="text-sm px-3 py-1.5 rounded-full border border-[var(--color-line-strong)] hover:border-[var(--color-ink)] transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="relative px-2 sm:px-6">
        <svg
          viewBox="0 0 400 510"
          role="img"
          aria-label="Puppy coloring page with 15 shade panels"
          className="w-full max-w-[440px] mx-auto block select-none touch-none cursor-pointer"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <ellipse cx="200" cy="488" rx="128" ry="14" fill="rgba(42,24,16,0.08)" />

          <g className={complete ? "puppy-tail-wag" : undefined}>
            {PANELS.filter((panel) => panel.id === "tail").map((panel) => (
              <PanelPath
                key={panel.id}
                panel={panel}
                fill={fills[panel.id] ?? panel.shade}
                painted={fills[panel.id] !== null}
                active={activePanel === panel.id}
                hint={!complete && hintUnpainted && fills[panel.id] === null}
              />
            ))}
          </g>

          {PANELS.filter((panel) => panel.id !== "tail").map((panel) => (
            <PanelPath
              key={panel.id}
              panel={panel}
              fill={fills[panel.id] ?? panel.shade}
              painted={fills[panel.id] !== null}
              active={activePanel === panel.id}
              hint={!complete && hintUnpainted && fills[panel.id] === null}
            />
          ))}

          <g pointerEvents="none" fill="none" stroke="#2A1810" strokeLinecap="round" strokeLinejoin="round">
            <path d="M128 122C52 128 22 188 38 240C50 274 102 262 130 208" strokeWidth="4" />
            <path d="M272 122C348 128 378 188 362 240C350 274 298 262 270 208" strokeWidth="4" />
            <path
              d="M122 158C128 80 272 80 278 158C306 178 310 232 276 254C252 268 224 274 200 274C176 274 148 268 124 254C90 232 94 178 122 158Z"
              strokeWidth="4.5"
            />
            <path
              d="M98 262C68 286 64 344 88 390C104 418 140 450 200 454C260 450 296 418 312 390C336 344 332 286 302 262"
              strokeWidth="4.5"
            />
            <path d="M116 396C98 418 96 464 110 482C122 496 164 498 176 478" strokeWidth="4" />
            <path d="M284 396C302 418 304 464 290 482C278 496 236 498 224 478" strokeWidth="4" />
            <path d="M92 308C22 278 2 332 18 384C30 418 78 400 112 348" strokeWidth="4" />
          </g>

          <g pointerEvents="none">
            <ellipse cx="164" cy="152" rx="16" ry="18" fill="#FFFDF8" stroke="#2A1810" strokeWidth="3" />
            <ellipse cx="236" cy="152" rx="16" ry="18" fill="#FFFDF8" stroke="#2A1810" strokeWidth="3" />
            <ellipse cx="167" cy="156" rx="8" ry="9.5" fill="#2A1810" />
            <ellipse cx="239" cy="156" rx="8" ry="9.5" fill="#2A1810" />
            <circle cx="162" cy="149" r="3" fill="#FFFDF8" />
            <circle cx="234" cy="149" r="3" fill="#FFFDF8" />
            <path
              d="M186 248C192 258 208 258 214 248"
              fill="none"
              stroke="#2A1810"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {complete ? (
              <path d="M188 252C194 268 206 268 212 252C206 258 194 258 188 252Z" fill="#F48FB1" />
            ) : null}
            <path d="M200 244V254" fill="none" stroke="#2A1810" strokeWidth="3" strokeLinecap="round" />
            <circle cx="174" cy="236" r="2.1" fill="#2A1810" />
            <circle cx="226" cy="236" r="2.1" fill="#2A1810" />
            <circle cx="166" cy="244" r="1.7" fill="#2A1810" />
            <circle cx="234" cy="244" r="1.7" fill="#2A1810" />
            <path
              d="M132 470C140 462 150 462 158 470"
              fill="none"
              stroke="#2A1810"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M242 470C250 462 260 462 268 470"
              fill="none"
              stroke="#2A1810"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>

      <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-[var(--color-line)] px-4 py-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-sm font-medium">Color for this panel</p>
          <label className="relative w-9 h-9 rounded-full border border-[var(--color-line-strong)] shadow-sm overflow-hidden cursor-pointer shrink-0">
            <span className="sr-only">Pick any color</span>
            <input
              type="color"
              value={selectedColor}
              onChange={(event) => setSelectedColor(event.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Pick any color"
            />
            <span className="block w-full h-full" style={{ background: selectedColor }} />
          </label>
        </div>
        <div className="grid grid-cols-8 gap-2 max-w-md">
          {COLORS.map((color) => {
            const selected = selectedColor.toLowerCase() === color.hex.toLowerCase();
            return (
              <button
                key={color.hex}
                type="button"
                onClick={() => setSelectedColor(color.hex)}
                aria-label={color.name}
                aria-pressed={selected}
                className={`aspect-square rounded-full border-2 transition-transform ${
                  selected
                    ? "border-[var(--color-ink)] scale-110"
                    : "border-black/10 hover:scale-105"
                }`}
                style={{ background: color.hex }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PanelPath({
  panel,
  fill,
  painted,
  active,
  hint,
}: {
  panel: Panel;
  fill: string;
  painted: boolean;
  active: boolean;
  hint: boolean;
}) {
  return (
    <path
      data-panel={panel.id}
      d={panel.d}
      fill={fill}
      stroke={active ? "#1a1a1a" : "#2A1810"}
      strokeWidth={active ? 4 : 2.75}
      strokeLinejoin="round"
      className={`transition-[fill,stroke-width] duration-150 ${hint ? "puppy-panel-hint" : ""}`}
      role="button"
      aria-label={`Paint the ${panel.label.toLowerCase()}`}
      tabIndex={-1}
    />
  );
}
