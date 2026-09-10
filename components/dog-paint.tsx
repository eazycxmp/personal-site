"use client";

import { useEffect, useRef, useState } from "react";

type Swatch = { name: string; hex: string };

type Suggestion = {
  label: string;
  swatch: Swatch;
};

const LINE_ART = "/puppy-coloring.png";
const BRUSH = 26;
const MAX_UNDO = 20;

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

function suggestFor(nx: number, ny: number, areaRatio: number): Suggestion {
  const inDog = nx > 0.18 && nx < 0.72 && ny > 0.12 && ny < 0.9;
  if (nx > 0.64 && nx < 0.88 && ny > 0.68 && ny < 0.88 && areaRatio < 0.06) {
    return { label: "the ball", swatch: { name: "Yellow", hex: "#FDD835" } };
  }
  if (ny < 0.42 && (nx < 0.26 || nx > 0.74)) {
    return { label: "the trees", swatch: { name: "Green", hex: "#43A047" } };
  }
  if (ny < 0.36 && areaRatio > 0.08) {
    return { label: "the sky", swatch: { name: "Sky", hex: "#4FC3F7" } };
  }
  if (ny > 0.72 && (nx < 0.2 || nx > 0.74 || !inDog)) {
    return { label: "the grass", swatch: { name: "Green", hex: "#66BB6A" } };
  }
  if (ny > 0.38 && ny < 0.6 && (nx < 0.22 || nx > 0.76)) {
    return { label: "the fence", swatch: { name: "Brown", hex: "#8D6E63" } };
  }
  if (inDog && ny < 0.42) {
    if (nx < 0.36) return { label: "the left ear", swatch: { name: "Golden", hex: "#E8B84A" } };
    if (nx > 0.6) return { label: "the right ear", swatch: { name: "Golden", hex: "#E8B84A" } };
    if (ny > 0.28 && nx > 0.42 && nx < 0.56) {
      return { label: "the nose", swatch: { name: "Black", hex: "#212121" } };
    }
    return { label: "the head", swatch: { name: "Golden", hex: "#E8B84A" } };
  }
  if (inDog && ny > 0.4 && ny < 0.5) {
    return { label: "the collar", swatch: { name: "Red", hex: "#E53935" } };
  }
  if (nx < 0.3 && ny > 0.5 && ny < 0.72) {
    return { label: "the tail", swatch: { name: "Golden", hex: "#E8B84A" } };
  }
  if (inDog && ny > 0.72) {
    return { label: "a paw", swatch: { name: "Golden", hex: "#E8B84A" } };
  }
  if (inDog) {
    return { label: "the puppy", swatch: { name: "Golden", hex: "#E8B84A" } };
  }
  return { label: "this space", swatch: { name: "Sky", hex: "#4FC3F7" } };
}

function buildWalls(image: HTMLImageElement) {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const map = document.createElement("canvas");
  map.width = width;
  map.height = height;
  const ctx = map.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0);
  const { data } = ctx.getImageData(0, 0, width, height);
  const walls = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const luma = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (data[i + 3] > 20 && luma < 155) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < width && ny < height) {
              walls[ny * width + nx] = 1;
            }
          }
        }
      }
    }
  }
  return { width, height, walls };
}

function nearestOpen(
  walls: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number
) {
  const sx = Math.max(0, Math.min(width - 1, Math.round(x)));
  const sy = Math.max(0, Math.min(height - 1, Math.round(y)));
  if (!walls[sy * width + sx]) return { x: sx, y: sy };
  for (let r = 1; r <= 24; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const nx = sx + dx;
        const ny = sy + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        if (!walls[ny * width + nx]) return { x: nx, y: ny };
      }
    }
  }
  return null;
}

function floodMask(
  walls: Uint8Array,
  width: number,
  height: number,
  sx: number,
  sy: number
) {
  const start = nearestOpen(walls, width, height, sx, sy);
  if (!start) return null;
  const mask = new Uint8Array(width * height);
  const stack = [start.x, start.y];
  let count = 0;
  let sumX = 0;
  let sumY = 0;
  while (stack.length) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    const i = y * width + x;
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    if (walls[i] || mask[i]) continue;
    mask[i] = 1;
    count++;
    sumX += x;
    sumY += y;
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }
  if (count < 20) return null;
  return {
    mask,
    count,
    cx: sumX / count,
    cy: sumY / count,
  };
}

function maskToCanvas(mask: Uint8Array, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(width, height);
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    const p = i * 4;
    image.data[p] = 255;
    image.data[p + 1] = 255;
    image.data[p + 2] = 255;
    image.data[p + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

export function DogPaint() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const paintRef = useRef<HTMLCanvasElement>(null);
  const scratchRef = useRef<HTMLCanvasElement | null>(null);
  const regionRef = useRef<HTMLCanvasElement | null>(null);
  const wallsRef = useRef<{ width: number; height: number; walls: Uint8Array } | null>(null);
  const lastPt = useRef<{ x: number; y: number } | null>(null);
  const drawingRef = useRef(false);
  const historyRef = useRef<ImageData[]>([]);

  const [ready, setReady] = useState(false);
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [painted, setPainted] = useState(false);

  const brushColor = pickedColor ?? suggestion?.swatch.hex ?? COLORS[10].hex;

  useEffect(() => {
    const image = new Image();
    image.src = LINE_ART;
    image.onload = () => {
      wallsRef.current = buildWalls(image);
      const paint = paintRef.current;
      if (!paint) return;
      paint.width = image.naturalWidth;
      paint.height = image.naturalHeight;
      const ctx = paint.getContext("2d")!;
      ctx.clearRect(0, 0, paint.width, paint.height);
      const scratch = document.createElement("canvas");
      scratch.width = paint.width;
      scratch.height = paint.height;
      scratchRef.current = scratch;
      setReady(true);
    };
  }, []);

  const pointFromEvent = (event: React.PointerEvent) => {
    const paint = paintRef.current;
    if (!paint) return null;
    const rect = paint.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * paint.width,
      y: ((event.clientY - rect.top) / rect.height) * paint.height,
    };
  };

  const pushHistory = () => {
    const paint = paintRef.current;
    const ctx = paint?.getContext("2d");
    if (!paint || !ctx) return;
    historyRef.current = [
      ...historyRef.current.slice(-(MAX_UNDO - 1)),
      ctx.getImageData(0, 0, paint.width, paint.height),
    ];
    setCanUndo(true);
  };

  const selectRegion = (x: number, y: number) => {
    const walls = wallsRef.current;
    if (!walls) return false;
    const flooded = floodMask(walls.walls, walls.width, walls.height, x, y);
    if (!flooded) {
      regionRef.current = null;
      return false;
    }
    regionRef.current = maskToCanvas(flooded.mask, walls.width, walls.height);
    const next = suggestFor(
      flooded.cx / walls.width,
      flooded.cy / walls.height,
      flooded.count / (walls.width * walls.height)
    );
    setSuggestion(next);
    return true;
  };

  const stamp = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const paint = paintRef.current;
    const scratch = scratchRef.current;
    const region = regionRef.current;
    if (!paint || !scratch || !region) return;
    const sctx = scratch.getContext("2d")!;
    sctx.clearRect(0, 0, scratch.width, scratch.height);
    sctx.globalCompositeOperation = "source-over";
    sctx.strokeStyle = brushColor;
    sctx.lineWidth = BRUSH;
    sctx.lineCap = "round";
    sctx.lineJoin = "round";
    sctx.beginPath();
    sctx.moveTo(from.x, from.y);
    sctx.lineTo(to.x, to.y);
    sctx.stroke();
    sctx.globalCompositeOperation = "destination-in";
    sctx.drawImage(region, 0, 0);
    paint.getContext("2d")!.drawImage(scratch, 0, 0);
    setPainted(true);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const pt = pointFromEvent(event);
    if (!pt) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    if (!selectRegion(pt.x, pt.y)) return;
    pushHistory();
    drawingRef.current = true;
    lastPt.current = pt;
    stamp(pt, pt);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !lastPt.current) return;
    const pt = pointFromEvent(event);
    if (!pt) return;
    stamp(lastPt.current, pt);
    lastPt.current = pt;
  };

  const onPointerUp = () => {
    drawingRef.current = false;
    lastPt.current = null;
  };

  const fillRegion = (hex: string) => {
    const paint = paintRef.current;
    const region = regionRef.current;
    const scratch = scratchRef.current;
    if (!paint || !region || !scratch) return;
    pushHistory();
    const sctx = scratch.getContext("2d")!;
    sctx.clearRect(0, 0, scratch.width, scratch.height);
    sctx.globalCompositeOperation = "source-over";
    sctx.fillStyle = hex;
    sctx.fillRect(0, 0, scratch.width, scratch.height);
    sctx.globalCompositeOperation = "destination-in";
    sctx.drawImage(region, 0, 0);
    paint.getContext("2d")!.drawImage(scratch, 0, 0);
    setPickedColor(hex);
    setPainted(true);
  };

  const undo = () => {
    const prev = historyRef.current.pop();
    const paint = paintRef.current;
    if (!prev || !paint) return;
    paint.getContext("2d")!.putImageData(prev, 0, 0);
    setCanUndo(historyRef.current.length > 0);
  };

  const reset = () => {
    const paint = paintRef.current;
    if (!paint) return;
    pushHistory();
    paint.getContext("2d")!.clearRect(0, 0, paint.width, paint.height);
    setPainted(false);
    setSuggestion(null);
    regionRef.current = null;
  };

  return (
    <div className="rounded-2xl border border-[var(--color-line-strong)] bg-white overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-muted)]">
            Coloring page
          </p>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            Tap a space for a color idea, then drag to paint. It cannot leave the lines.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="text-sm px-3 py-1.5 rounded-full border border-[var(--color-line-strong)] disabled:opacity-40 hover:border-[var(--color-ink)] transition-colors"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={!painted}
            className="text-sm px-3 py-1.5 rounded-full border border-[var(--color-line-strong)] disabled:opacity-40 hover:border-[var(--color-ink)] transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {suggestion ? (
        <div className="mx-5 mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-[var(--color-cream)] px-3 py-2.5">
          <p className="text-sm">
            <span className="text-[var(--color-muted)]">For {suggestion.label}, try </span>
            <span className="font-medium">{suggestion.swatch.name.toLowerCase()}</span>
          </p>
          <button
            type="button"
            onClick={() => fillRegion(suggestion.swatch.hex)}
            className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full bg-white border border-[var(--color-line-strong)] hover:border-[var(--color-ink)] transition-colors"
          >
            <span
              className="w-4 h-4 rounded-full border border-black/15"
              style={{ background: suggestion.swatch.hex }}
            />
            Fill {suggestion.swatch.name}
          </button>
        </div>
      ) : null}

      <div ref={wrapRef} className="relative px-2 sm:px-6 pb-2">
        <div className="relative max-w-[560px] mx-auto aspect-square bg-white">
          <canvas
            ref={paintRef}
            className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LINE_ART}
            alt="Puppy coloring page"
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none mix-blend-multiply"
          />
          {!ready ? (
            <p className="absolute inset-0 grid place-items-center text-sm text-[var(--color-muted)]">
              Loading the coloring page…
            </p>
          ) : null}
        </div>
      </div>

      <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-[var(--color-line)] px-4 py-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-sm font-medium">
            {pickedColor ? "Your color" : "Pick a color, or tap the picture for a suggestion"}
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
            const suggested = suggestion?.swatch.hex.toLowerCase() === color.hex.toLowerCase();
            return (
              <button
                key={color.hex + color.name}
                type="button"
                onClick={() => setPickedColor(color.hex)}
                aria-label={color.name}
                aria-pressed={!!selected}
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
