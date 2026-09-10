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
    shade: "#8A7560",
    d: "M108 338C55 322 26 356 40 402C51 432 88 420 118 386C130 368 124 348 108 338Z",
  },
  {
    id: "saddle",
    label: "Back",
    shade: "#7A6550",
    d: "M120 276C76 298 70 358 94 408C126 386 274 386 306 408C330 358 324 298 280 276C244 250 156 250 120 276Z",
  },
  {
    id: "belly",
    label: "Belly",
    shade: "#D4C4B0",
    d: "M118 366C106 400 120 446 158 462C184 472 216 472 242 462C280 446 294 400 282 366C250 390 150 390 118 366Z",
  },
  {
    id: "leftLeg",
    label: "Left paw",
    shade: "#B89F86",
    d: "M124 394C110 412 108 458 117 476C126 492 160 494 172 476C183 460 176 418 164 396C151 384 136 384 124 394Z",
  },
  {
    id: "rightLeg",
    label: "Right paw",
    shade: "#B89F86",
    d: "M276 394C290 412 292 458 283 476C274 492 240 494 228 476C217 460 224 418 236 396C249 384 264 384 276 394Z",
  },
  {
    id: "chest",
    label: "Chest",
    shade: "#EDE4D8",
    d: "M154 270C130 296 128 348 154 372C176 390 224 390 246 372C272 348 270 296 246 270C224 250 176 250 154 270Z",
  },
  {
    id: "leftEar",
    label: "Left ear",
    shade: "#8A7560",
    d: "M150 148C94 68 20 106 46 188C58 232 118 228 156 186C166 170 164 156 150 148Z",
  },
  {
    id: "rightEar",
    label: "Right ear",
    shade: "#8A7560",
    d: "M250 148C306 68 380 106 354 188C342 232 282 228 244 186C234 170 236 156 250 148Z",
  },
  {
    id: "forehead",
    label: "Forehead",
    shade: "#A89078",
    d: "M132 150C148 86 252 86 268 150C250 182 226 204 200 204C174 204 150 182 132 150Z",
  },
  {
    id: "leftCheek",
    label: "Left cheek",
    shade: "#C4AE96",
    d: "M132 150C84 172 76 250 124 276C150 270 172 244 178 218C170 184 150 158 132 150Z",
  },
  {
    id: "rightCheek",
    label: "Right cheek",
    shade: "#C4AE96",
    d: "M268 150C316 172 324 250 276 276C250 270 228 244 222 218C230 184 250 158 268 150Z",
  },
  {
    id: "muzzle",
    label: "Muzzle",
    shade: "#E2D3C2",
    d: "M154 198C142 216 144 272 176 288C190 296 210 296 224 288C256 272 258 216 246 198C230 184 170 184 154 198Z",
  },
  {
    id: "leftInnerEar",
    label: "Inside left ear",
    shade: "#C9B09A",
    d: "M138 158C100 116 66 134 76 182C83 206 120 202 142 176C149 166 145 160 138 158Z",
  },
  {
    id: "rightInnerEar",
    label: "Inside right ear",
    shade: "#C9B09A",
    d: "M262 158C300 116 334 134 324 182C317 206 280 202 258 176C251 166 255 160 262 158Z",
  },
  {
    id: "nose",
    label: "Nose",
    shade: "#4A3A32",
    d: "M182 232C172 238 170 252 184 264C193 271 207 271 216 264C230 252 228 238 218 232C210 224 190 224 182 232Z",
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

const STORAGE_KEY = "puppy-paint-v1";

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

  const paintedCount = PANELS.filter((panel) => fills[panel.id] !== null).length;
  const complete = paintedCount === PANELS.length;

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
          viewBox="0 0 400 500"
          role="img"
          aria-label="Puppy coloring page with 15 shade panels"
          className="w-full max-w-[420px] mx-auto block select-none touch-none cursor-pointer"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <ellipse cx="200" cy="472" rx="118" ry="14" fill="rgba(42,24,16,0.08)" />

          <g className={complete ? "puppy-tail-wag" : undefined}>
            {PANELS.filter((panel) => panel.id === "tail").map((panel) => (
              <PanelPath
                key={panel.id}
                panel={panel}
                fill={fills[panel.id] ?? panel.shade}
                painted={fills[panel.id] !== null}
                active={activePanel === panel.id}
              />
            ))}
            <path
              d="M108 338C55 322 26 356 40 402C51 432 88 420 118 386"
              fill="none"
              stroke="#2A1810"
              strokeWidth="4"
              strokeLinecap="round"
              pointerEvents="none"
            />
          </g>

          {PANELS.filter((panel) => panel.id !== "tail").map((panel) => (
            <PanelPath
              key={panel.id}
              panel={panel}
              fill={fills[panel.id] ?? panel.shade}
              painted={fills[panel.id] !== null}
              active={activePanel === panel.id}
            />
          ))}

          <g pointerEvents="none" fill="none" stroke="#2A1810" strokeLinecap="round" strokeLinejoin="round">
            <path
              d="M150 148C94 68 20 106 46 188C58 232 118 228 156 186"
              strokeWidth="4"
            />
            <path
              d="M250 148C306 68 380 106 354 188C342 232 282 228 244 186"
              strokeWidth="4"
            />
            <path
              d="M132 150C84 172 76 250 124 276C150 292 176 300 200 300C224 300 250 292 276 276C324 250 316 172 268 150C252 86 148 86 132 150Z"
              strokeWidth="4.5"
            />
            <path
              d="M120 276C76 298 70 358 94 408C110 430 140 455 200 458C260 455 290 430 306 408C330 358 324 298 280 276"
              strokeWidth="4.5"
            />
            <path
              d="M124 394C110 412 108 458 117 476C126 492 160 494 172 476C183 460 176 418 164 396"
              strokeWidth="4"
            />
            <path
              d="M276 394C290 412 292 458 283 476C274 492 240 494 228 476C217 460 224 418 236 396"
              strokeWidth="4"
            />
          </g>

          <g pointerEvents="none">
            <ellipse cx="168" cy="176" rx="17" ry="19" fill="#FFFDF8" stroke="#2A1810" strokeWidth="3" />
            <ellipse cx="232" cy="176" rx="17" ry="19" fill="#FFFDF8" stroke="#2A1810" strokeWidth="3" />
            <ellipse cx="171" cy="180" rx="8.5" ry="10" fill="#2A1810" />
            <ellipse cx="235" cy="180" rx="8.5" ry="10" fill="#2A1810" />
            <circle cx="166" cy="173" r="3.2" fill="#FFFDF8" />
            <circle cx="230" cy="173" r="3.2" fill="#FFFDF8" />
            <path
              d="M188 262C192 268 208 268 212 262"
              fill="none"
              stroke="#2A1810"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {complete ? (
              <path d="M188 266C194 280 206 280 212 266C206 272 194 272 188 266Z" fill="#F48FB1" />
            ) : null}
            <path
              d="M200 264V272"
              fill="none"
              stroke="#2A1810"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="176" cy="248" r="2.2" fill="#2A1810" />
            <circle cx="224" cy="248" r="2.2" fill="#2A1810" />
            <circle cx="168" cy="256" r="1.8" fill="#2A1810" />
            <circle cx="232" cy="256" r="1.8" fill="#2A1810" />
            <path
              d="M140 456C146 450 154 450 160 456"
              fill="none"
              stroke="#2A1810"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M240 456C246 450 254 450 260 456"
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
}: {
  panel: Panel;
  fill: string;
  painted: boolean;
  active: boolean;
}) {
  return (
    <path
      data-panel={panel.id}
      d={panel.d}
      fill={fill}
      stroke={active ? "#1a1a1a" : painted ? "rgba(42,24,16,0.35)" : "rgba(42,24,16,0.22)"}
      strokeWidth={active ? 3.5 : 2}
      strokeLinejoin="round"
      className="transition-[fill,stroke] duration-150"
      role="button"
      aria-label={`Paint the ${panel.label.toLowerCase()}`}
      tabIndex={-1}
    />
  );
}
