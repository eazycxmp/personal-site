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
  | "body"
  | "belly"
  | "leftLeg"
  | "rightLeg"
  | "tail";

type Swatch = { name: string; hex: string };

type Panel = {
  id: PanelId;
  label: string;
  d: string;
  suggested: Swatch;
};

type Stroke = {
  id: number;
  panelId: PanelId;
  color: string;
  points: string;
};

const BLANK = "#FFFFFF";
const BRUSH = 28;

const PANELS: Panel[] = [
  {
    id: "tail",
    label: "Tail",
    suggested: { name: "Brown", hex: "#8D6E63" },
    d: "M86 300C28 278 8 328 24 368C36 394 78 376 108 332C116 314 108 304 86 300Z",
  },
  {
    id: "body",
    label: "Back",
    suggested: { name: "Caramel", hex: "#C68642" },
    d: "M108 248C72 272 68 348 102 398C138 428 262 428 298 398C332 348 328 272 292 248C250 222 150 222 108 248Z",
  },
  {
    id: "belly",
    label: "Belly",
    suggested: { name: "Cream", hex: "#F3E6D4" },
    d: "M148 338C128 360 136 404 176 418C200 426 200 426 224 418C264 404 272 360 252 338C228 354 172 354 148 338Z",
  },
  {
    id: "leftLeg",
    label: "Left paw",
    suggested: { name: "Golden", hex: "#E8B84A" },
    d: "M128 392C112 414 114 454 132 466C148 476 176 472 184 452C188 428 168 400 150 390C142 386 134 386 128 392Z",
  },
  {
    id: "rightLeg",
    label: "Right paw",
    suggested: { name: "Golden", hex: "#E8B84A" },
    d: "M272 392C288 414 286 454 268 466C252 476 224 472 216 452C212 428 232 400 250 390C258 386 266 386 272 392Z",
  },
  {
    id: "chest",
    label: "Chest",
    suggested: { name: "Cream", hex: "#F3E6D4" },
    d: "M168 258C148 280 148 322 172 344C188 356 212 356 228 344C252 322 252 280 232 258C216 246 184 246 168 258Z",
  },
  {
    id: "leftEar",
    label: "Left ear",
    suggested: { name: "Brown", hex: "#8D6E63" },
    d: "M132 118C70 108 36 148 48 196C58 228 104 216 136 168C142 148 142 126 132 118Z",
  },
  {
    id: "rightEar",
    label: "Right ear",
    suggested: { name: "Brown", hex: "#8D6E63" },
    d: "M268 118C330 108 364 148 352 196C342 228 296 216 264 168C258 148 258 126 268 118Z",
  },
  {
    id: "forehead",
    label: "Forehead",
    suggested: { name: "Golden", hex: "#E8B84A" },
    d: "M128 148C136 78 264 78 272 148C246 164 154 164 128 148Z",
  },
  {
    id: "leftCheek",
    label: "Left cheek",
    suggested: { name: "Golden", hex: "#E8B84A" },
    d: "M128 148C100 168 98 214 130 234C152 228 164 200 166 172C154 156 140 148 128 148Z",
  },
  {
    id: "rightCheek",
    label: "Right cheek",
    suggested: { name: "Golden", hex: "#E8B84A" },
    d: "M272 148C300 168 302 214 270 234C248 228 236 200 234 172C246 156 260 148 272 148Z",
  },
  {
    id: "muzzle",
    label: "Muzzle",
    suggested: { name: "Cream", hex: "#F3E6D4" },
    d: "M162 168C148 186 150 226 178 240C192 248 208 248 222 240C250 226 252 186 238 168C222 156 178 156 162 168Z",
  },
  {
    id: "leftInnerEar",
    label: "Inside left ear",
    suggested: { name: "Pink", hex: "#EC407A" },
    d: "M124 136C82 132 64 160 72 190C80 208 110 198 128 168C132 154 132 140 124 136Z",
  },
  {
    id: "rightInnerEar",
    label: "Inside right ear",
    suggested: { name: "Pink", hex: "#EC407A" },
    d: "M276 136C318 132 336 160 328 190C320 208 290 198 272 168C268 154 268 140 276 136Z",
  },
  {
    id: "nose",
    label: "Nose",
    suggested: { name: "Black", hex: "#212121" },
    d: "M182 196C172 202 172 216 186 226C194 232 206 232 214 226C228 216 228 202 218 196C210 190 190 190 182 196Z",
  },
];

const COLORS: Swatch[] = [
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
  { name: "Brown", hex: "#8D6E63" },
  { name: "Cream", hex: "#F3E6D4" },
  { name: "Black", hex: "#212121" },
  { name: "White", hex: "#FFFFFF" },
];

const STORAGE_KEY = "puppy-paint-v4";

const emptyFills = (): Record<PanelId, string | null> =>
  Object.fromEntries(PANELS.map((panel) => [panel.id, null])) as Record<
    PanelId,
    string | null
  >;

function panelById(id: PanelId) {
  return PANELS.find((panel) => panel.id === id)!;
}

function panelIdFromPoint(x: number, y: number): PanelId | null {
  const el = document.elementFromPoint(x, y);
  const host = el?.closest("[data-panel]");
  const id = host?.getAttribute("data-panel");
  return id && PANELS.some((panel) => panel.id === id) ? (id as PanelId) : null;
}

function toSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const mapped = pt.matrixTransform(ctm.inverse());
  return `${mapped.x.toFixed(1)},${mapped.y.toFixed(1)}`;
}

function loadSaved(): {
  fills: Record<PanelId, string | null>;
  strokes: Stroke[];
} {
  if (typeof window === "undefined") return { fills: emptyFills(), strokes: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { fills: emptyFills(), strokes: [] };
    const parsed = JSON.parse(raw) as {
      fills?: Partial<Record<PanelId, string | null>>;
      strokes?: Stroke[];
    };
    const fills = emptyFills();
    for (const panel of PANELS) {
      const value = parsed.fills?.[panel.id];
      if (typeof value === "string" || value === null) fills[panel.id] = value;
    }
    const strokes = Array.isArray(parsed.strokes)
      ? parsed.strokes.filter(
          (stroke) =>
            stroke &&
            typeof stroke.points === "string" &&
            PANELS.some((panel) => panel.id === stroke.panelId)
        )
      : [];
    return { fills, strokes };
  } catch {
    return { fills: emptyFills(), strokes: [] };
  }
}

export function DogPaint() {
  const svgRef = useRef<SVGSVGElement>(null);
  const drawingRef = useRef(false);
  const strokeRef = useRef<Stroke | null>(null);
  const fillsRef = useRef<Record<PanelId, string | null>>(emptyFills());
  const strokesRef = useRef<Stroke[]>([]);
  const nextId = useRef(1);

  const [fills, setFills] = useState<Record<PanelId, string | null>>(emptyFills);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [focusPanel, setFocusPanel] = useState<PanelId | null>(null);
  const [history, setHistory] = useState<
    { fills: Record<PanelId, string | null>; strokes: Stroke[] }[]
  >([]);
  const [hydrated, setHydrated] = useState(false);

  fillsRef.current = fills;
  strokesRef.current = strokes;

  useEffect(() => {
    const saved = loadSaved();
    setFills(saved.fills);
    setStrokes(saved.strokes);
    nextId.current =
      saved.strokes.reduce((max, stroke) => Math.max(max, stroke.id), 0) + 1;
    fillsRef.current = saved.fills;
    strokesRef.current = saved.strokes;
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ fills, strokes })
    );
  }, [fills, strokes, hydrated]);

  const paintedCount = PANELS.filter(
    (panel) =>
      fills[panel.id] !== null || strokes.some((stroke) => stroke.panelId === panel.id)
  ).length;
  const complete = paintedCount === PANELS.length;
  const focused = focusPanel ? panelById(focusPanel) : null;
  const brushColor = pickedColor ?? focused?.suggested.hex ?? COLORS[10].hex;

  const snapshot = () => {
    setHistory((h) => [
      ...h.slice(-24),
      { fills: fillsRef.current, strokes: strokesRef.current },
    ]);
  };

  const colorFor = useCallback(
    (id: PanelId) => pickedColor ?? panelById(id).suggested.hex,
    [pickedColor]
  );

  const startOrContinueStroke = (id: PanelId, point: string) => {
    const color = colorFor(id);
    const current = strokeRef.current;
    if (current && current.panelId === id && current.color === color) {
      current.points += ` ${point}`;
      setStrokes((prev) =>
        prev.map((stroke) =>
          stroke.id === current.id ? { ...current } : stroke
        )
      );
      return;
    }
    if (!current) snapshot();
    const next: Stroke = {
      id: nextId.current++,
      panelId: id,
      color,
      points: point,
    };
    strokeRef.current = next;
    strokesRef.current = [...strokesRef.current, next];
    setStrokes(strokesRef.current);
  };

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    event.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const id = panelIdFromPoint(event.clientX, event.clientY);
    if (!id) return;
    const point = toSvgPoint(svg, event.clientX, event.clientY);
    if (!point) return;
    drawingRef.current = true;
    svg.setPointerCapture(event.pointerId);
    setFocusPanel(id);
    startOrContinueStroke(id, point);
  };

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!drawingRef.current || !svgRef.current) return;
    const id = panelIdFromPoint(event.clientX, event.clientY);
    if (!id) {
      strokeRef.current = null;
      return;
    }
    setFocusPanel(id);
    const point = toSvgPoint(svgRef.current, event.clientX, event.clientY);
    if (point) startOrContinueStroke(id, point);
  };

  const onPointerUp = () => {
    drawingRef.current = false;
    strokeRef.current = null;
  };

  const fillPanel = (id: PanelId, color: string) => {
    if (fillsRef.current[id] === color) return;
    snapshot();
    const next = { ...fillsRef.current, [id]: color };
    fillsRef.current = next;
    setFills(next);
    setFocusPanel(id);
    setPickedColor(color);
  };

  const undo = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    fillsRef.current = prev.fills;
    strokesRef.current = prev.strokes;
    setFills(prev.fills);
    setStrokes(prev.strokes);
  };

  const reset = () => {
    snapshot();
    const next = emptyFills();
    fillsRef.current = next;
    strokesRef.current = [];
    setFills(next);
    setStrokes([]);
    setFocusPanel(null);
  };

  return (
    <div className="rounded-2xl border border-[var(--color-line-strong)] bg-white overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-muted)]">
            {paintedCount} / {PANELS.length} panels
          </p>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            {complete
              ? "You painted the whole puppy!"
              : "Drag your finger inside a panel. The color stays in the lines."}
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

      {focused ? (
        <div className="mx-5 mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-[var(--color-cream)] px-3 py-2.5">
          <p className="text-sm">
            <span className="font-medium">{focused.label}</span>
            <span className="text-[var(--color-muted)]"> — try {focused.suggested.name.toLowerCase()}</span>
          </p>
          <button
            type="button"
            onClick={() => fillPanel(focused.id, focused.suggested.hex)}
            className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full bg-white border border-[var(--color-line-strong)] hover:border-[var(--color-ink)] transition-colors"
          >
            <span
              className="w-4 h-4 rounded-full border border-black/15"
              style={{ background: focused.suggested.hex }}
            />
            Use {focused.suggested.name}
          </button>
        </div>
      ) : null}

      <div className="relative px-2 sm:px-6">
        <svg
          ref={svgRef}
          viewBox="0 0 400 490"
          role="img"
          aria-label="Puppy coloring page. Drag to paint inside each panel."
          className="w-full max-w-[440px] mx-auto block select-none touch-none cursor-crosshair"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <defs>
            {PANELS.map((panel) => (
              <clipPath key={panel.id} id={`pup-clip-${panel.id}`} clipPathUnits="userSpaceOnUse">
                <path d={panel.d} />
              </clipPath>
            ))}
          </defs>

          <ellipse cx="200" cy="468" rx="120" ry="12" fill="rgba(42,24,16,0.08)" />

          <g className={complete ? "puppy-tail-wag" : undefined}>
            <PanelDraw
              panel={panelById("tail")}
              fill={fills.tail}
              strokes={strokes.filter((stroke) => stroke.panelId === "tail")}
              active={focusPanel === "tail"}
            />
          </g>

          {PANELS.filter((panel) => panel.id !== "tail").map((panel) => (
            <PanelDraw
              key={panel.id}
              panel={panel}
              fill={fills[panel.id]}
              strokes={strokes.filter((stroke) => stroke.panelId === panel.id)}
              active={focusPanel === panel.id}
            />
          ))}

          <g pointerEvents="none" fill="none" stroke="#1a1a1a" strokeLinejoin="round">
            {PANELS.map((panel) => (
              <path key={`outline-${panel.id}`} d={panel.d} strokeWidth="3" />
            ))}
          </g>

          <g pointerEvents="none">
            <ellipse cx="168" cy="132" rx="13" ry="15" fill="#FFFDF8" stroke="#1a1a1a" strokeWidth="2.75" />
            <ellipse cx="232" cy="132" rx="13" ry="15" fill="#FFFDF8" stroke="#1a1a1a" strokeWidth="2.75" />
            <ellipse cx="170" cy="135" rx="6" ry="7" fill="#1a1a1a" />
            <ellipse cx="234" cy="135" rx="6" ry="7" fill="#1a1a1a" />
            <circle cx="166" cy="129" r="2.2" fill="#FFFDF8" />
            <circle cx="230" cy="129" r="2.2" fill="#FFFDF8" />
            <path
              d="M186 232C192 240 208 240 214 232"
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="2.75"
              strokeLinecap="round"
            />
            {complete ? (
              <path d="M188 236C194 250 206 250 212 236C206 242 194 242 188 236Z" fill="#F48FB1" />
            ) : null}
          </g>
        </svg>
      </div>

      <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-[var(--color-line)] px-4 py-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-sm font-medium">
            {pickedColor ? "Your color" : "Pick a color, or tap a panel for a suggestion"}
          </p>
          <label className="relative w-9 h-9 rounded-full border border-[var(--color-line-strong)] shadow-sm overflow-hidden cursor-pointer shrink-0">
            <span className="sr-only">Pick any color</span>
            <input
              type="color"
              value={brushColor}
              onChange={(event) => setPickedColor(event.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Pick any color"
            />
            <span className="block w-full h-full" style={{ background: brushColor }} />
          </label>
        </div>
        <div className="grid grid-cols-8 gap-2 max-w-md">
          {COLORS.map((color) => {
            const selected = pickedColor?.toLowerCase() === color.hex.toLowerCase();
            const suggested = focused?.suggested.hex.toLowerCase() === color.hex.toLowerCase();
            return (
              <button
                key={color.hex + color.name}
                type="button"
                onClick={() => setPickedColor(color.hex)}
                aria-label={color.name}
                aria-pressed={selected}
                className={`aspect-square rounded-full border-2 transition-transform ${
                  selected
                    ? "border-[var(--color-ink)] scale-110"
                    : suggested
                      ? "border-[var(--color-accent)] scale-105"
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

function PanelDraw({
  panel,
  fill,
  strokes,
  active,
}: {
  panel: Panel;
  fill: string | null;
  strokes: Stroke[];
  active: boolean;
}) {
  return (
    <g>
      <g clipPath={`url(#pup-clip-${panel.id})`}>
        <path data-panel={panel.id} d={panel.d} fill={fill ?? BLANK} />
        {strokes.map((stroke) => (
          <polyline
            key={stroke.id}
            points={stroke.points}
            fill="none"
            stroke={stroke.color}
            strokeWidth={BRUSH}
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="none"
          />
        ))}
      </g>
      {active ? (
        <path
          d={panel.d}
          fill="none"
          stroke="#4628B8"
          strokeWidth="4"
          pointerEvents="none"
        />
      ) : null}
    </g>
  );
}
