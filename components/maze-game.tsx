"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const CELL = 24;

function getLevelConfig(level: number) {
  const baseSize = 11;
  const size = Math.min(baseSize + Math.floor((level - 1) / 2) * 2, 25);
  const cols = size % 2 === 0 ? size + 1 : size;
  const rows = cols;
  const speed = 3 + (level - 1) * 0.7;
  const hazardRate = Math.min(0.3 + (level - 1) * 0.25, 3.0);
  const timeLimit = Math.max(60 - (level - 1) * 3, 20);
  return { cols, rows, speed, hazardRate, timeLimit };
}

type Pos = { x: number; y: number };
type Dir = "up" | "down" | "left" | "right" | null;
type Hazard = { x: number; y: number; vx: number; vy: number; life: number };
type LeaderboardEntry = { name: string; level: number; date: string };

function generateMaze(cols: number, rows: number): string[] {
  const grid: string[][] = Array.from({ length: rows }, () =>
    Array(cols).fill("#")
  );
  function carve(x: number, y: number) {
    grid[y][x] = ".";
    const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]].sort(() => Math.random() - 0.5);
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1 && grid[ny][nx] === "#") {
        grid[y + dy / 2][x + dx / 2] = ".";
        carve(nx, ny);
      }
    }
  }
  carve(1, 1);
  return grid.map((row) => row.join(""));
}

function pickRandomOpenCell(maze: string[], avoid?: Pos): Pos {
  const cols = maze[0].length;
  const rows = maze.length;
  let attempts = 0;
  while (attempts < 200) {
    const x = Math.floor(Math.random() * cols);
    const y = Math.floor(Math.random() * rows);
    if (maze[y][x] === ".") {
      if (!avoid || Math.abs(x - avoid.x) + Math.abs(y - avoid.y) > Math.floor(cols / 2)) {
        return { x, y };
      }
    }
    attempts++;
  }
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++)
      if (maze[y][x] === ".") return { x, y };
  return { x: 1, y: 1 };
}

function saveLeaderboard(entries: LeaderboardEntry[]) {
  localStorage.setItem("mazeRunLeaderboard", JSON.stringify(entries));
}

function addEntry(
  current: LeaderboardEntry[],
  name: string,
  level: number
): LeaderboardEntry[] {
  const entry: LeaderboardEntry = {
    name: name.trim() || "Anon",
    level,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  };
  return [...current, entry].sort((a, b) => b.level - a.level).slice(0, 10);
}

export function MazeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "won" | "dead">("idle");
  const [level, setLevel] = useState(1);
  const [bestLevel, setBestLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canvasDims, setCanvasDims] = useState(() => {
    const c = getLevelConfig(1);
    return { w: c.cols * CELL, h: c.rows * CELL };
  });

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [runLevel, setRunLevel] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const mazeRef = useRef<string[]>([]);
  const startRef = useRef<Pos>({ x: 1, y: 1 });
  const goalRef = useRef<Pos>({ x: 1, y: 1 });
  const playerRef = useRef<Pos>({ x: 1, y: 1 });
  const subPosRef = useRef<{ x: number; y: number }>({ x: 1, y: 1 });
  const dirRef = useRef<Dir>(null);
  const queuedDirRef = useRef<Dir>(null);
  const speedRef = useRef(3);
  const hazardsRef = useRef<Hazard[]>([]);
  const lastHazardSpawnRef = useRef(0);
  const startTimeRef = useRef(0);
  const animFrameRef = useRef(0);
  const levelConfigRef = useRef(getLevelConfig(1));
  const currentLevelRef = useRef(1);

  useEffect(() => {
    const stored = localStorage.getItem("mazeRunBestLevel");
    if (stored) setBestLevel(parseInt(stored, 10));
    const lb = localStorage.getItem("mazeRunLeaderboard");
    if (lb) setLeaderboard(JSON.parse(lb));
  }, []);

  const setupLevel = useCallback((lvl: number) => {
    const config = getLevelConfig(lvl);
    levelConfigRef.current = config;
    currentLevelRef.current = lvl;
    const maze = generateMaze(config.cols, config.rows);
    mazeRef.current = maze;
    const start = pickRandomOpenCell(maze);
    const goal = pickRandomOpenCell(maze, start);
    startRef.current = start;
    goalRef.current = goal;
    playerRef.current = { ...start };
    subPosRef.current = { x: start.x, y: start.y };
    dirRef.current = null;
    queuedDirRef.current = null;
    speedRef.current = config.speed;
    hazardsRef.current = [];
    lastHazardSpawnRef.current = performance.now();
    startTimeRef.current = performance.now();
    setTimeLeft(config.timeLimit);
    setCanvasDims({ w: config.cols * CELL, h: config.rows * CELL });
  }, []);

  const startGame = useCallback(() => {
    setLevel(1);
    setRunLevel(0);
    setSubmitted(false);
    setNameInput("");
    setupLevel(1);
    setGameState("playing");
  }, [setupLevel]);

  const nextLevel = useCallback(() => {
    const next = level + 1;
    setLevel(next);
    setupLevel(next);
    setGameState("playing");
  }, [level, setupLevel]);

  const tryDir = useCallback((dir: Dir) => {
    queuedDirRef.current = dir;
  }, []);

  const isWall = useCallback((x: number, y: number) => {
    const maze = mazeRef.current;
    if (!maze.length) return true;
    if (x < 0 || x >= maze[0].length || y < 0 || y >= maze.length) return true;
    return maze[y][x] === "#";
  }, []);

  const handleSubmitScore = useCallback(() => {
    const updated = addEntry(leaderboard, nameInput, runLevel);
    setLeaderboard(updated);
    saveLeaderboard(updated);
    setSubmitted(true);
  }, [leaderboard, nameInput, runLevel]);

  // Input
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameState === "idle" || gameState === "dead") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          startGame();
          return;
        }
      }
      if (gameState === "won") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          nextLevel();
          return;
        }
      }
      if (gameState !== "playing") return;
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") tryDir("up");
      else if (k === "arrowdown" || k === "s") tryDir("down");
      else if (k === "arrowleft" || k === "a") tryDir("left");
      else if (k === "arrowright" || k === "d") tryDir("right");
      if (k.startsWith("arrow") || ["w", "a", "s", "d", " "].includes(k)) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gameState, startGame, nextLevel, tryDir]);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const config = levelConfigRef.current;
      const elapsed = (now - startTimeRef.current) / 1000;
      const remaining = Math.max(config.timeLimit - elapsed, 0);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        endRun();
        return;
      }

      const sub = subPosRef.current;
      const grid = playerRef.current;
      const queued = queuedDirRef.current;

      const atGridCenter =
        Math.abs(sub.x - grid.x) < 0.05 && Math.abs(sub.y - grid.y) < 0.05;

      if (atGridCenter) {
        sub.x = grid.x;
        sub.y = grid.y;
        if (queued) {
          const next = applyDir(grid, queued);
          if (!isWall(next.x, next.y)) {
            dirRef.current = queued;
            queuedDirRef.current = null;
          }
        }
        const currentDir = dirRef.current;
        if (currentDir) {
          const next = applyDir(grid, currentDir);
          if (!isWall(next.x, next.y)) {
            playerRef.current = next;
          } else {
            dirRef.current = null;
          }
        }
      } else {
        const moveAmt = config.speed * dt;
        if (sub.x < grid.x) sub.x = Math.min(sub.x + moveAmt, grid.x);
        else if (sub.x > grid.x) sub.x = Math.max(sub.x - moveAmt, grid.x);
        if (sub.y < grid.y) sub.y = Math.min(sub.y + moveAmt, grid.y);
        else if (sub.y > grid.y) sub.y = Math.max(sub.y - moveAmt, grid.y);
      }

      const goal = goalRef.current;
      if (Math.abs(sub.x - goal.x) < 0.4 && Math.abs(sub.y - goal.y) < 0.4) {
        const reached = currentLevelRef.current;
        const newBest = Math.max(reached + 1, bestLevel);
        if (newBest > bestLevel) {
          setBestLevel(newBest);
          localStorage.setItem("mazeRunBestLevel", String(newBest));
        }
        setGameState("won");
        return;
      }

      const spawnInterval = 1000 / config.hazardRate;
      if (now - lastHazardSpawnRef.current > spawnInterval) {
        lastHazardSpawnRef.current = now;
        spawnHazard(config);
      }

      hazardsRef.current = hazardsRef.current
        .map((h) => ({ ...h, x: h.x + h.vx * dt, y: h.y + h.vy * dt, life: h.life - dt }))
        .filter((h) => h.life > 0 && h.x > -1 && h.x < config.cols + 1 && h.y > -1 && h.y < config.rows + 1);

      for (const h of hazardsRef.current) {
        const dx = h.x - sub.x;
        const dy = h.y - sub.y;
        if (dx * dx + dy * dy < 0.25) {
          endRun();
          return;
        }
      }

      drawScene(ctx, config, sub, goal, hazardsRef.current);
      animFrameRef.current = requestAnimationFrame(step);
    };

    function spawnHazard(config: ReturnType<typeof getLevelConfig>) {
      const side = Math.floor(Math.random() * 4);
      let x = 0, y = 0, vx = 0, vy = 0;
      const speed = 2 + Math.random() * 2;
      if (side === 0) { x = Math.random() * config.cols; y = -0.5; vy = speed; }
      else if (side === 1) { x = Math.random() * config.cols; y = config.rows + 0.5; vy = -speed; }
      else if (side === 2) { x = -0.5; y = Math.random() * config.rows; vx = speed; }
      else { x = config.cols + 0.5; y = Math.random() * config.rows; vx = -speed; }
      hazardsRef.current.push({ x, y, vx, vy, life: 6 });
    }

    function drawScene(
      ctx: CanvasRenderingContext2D,
      config: ReturnType<typeof getLevelConfig>,
      sub: { x: number; y: number },
      goal: Pos,
      hazards: Hazard[]
    ) {
      const w = config.cols * CELL;
      const h = config.rows * CELL;
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, w, h);

      const maze = mazeRef.current;
      ctx.fillStyle = "#1a1a1a";
      ctx.strokeStyle = "#2a2a2a";
      ctx.lineWidth = 1;
      for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
          if (maze[y][x] === "#") {
            ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
            ctx.strokeRect(x * CELL + 0.5, y * CELL + 0.5, CELL - 1, CELL - 1);
          }
        }
      }

      const pulse = (Math.sin(performance.now() / 250) + 1) / 2;
      ctx.fillStyle = `rgba(34, 197, 94, ${0.4 + pulse * 0.6})`;
      ctx.shadowColor = "#22c55e";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(goal.x * CELL + CELL / 2, goal.y * CELL + CELL / 2, CELL / 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      hazards.forEach((hz) => {
        ctx.fillStyle = "rgba(255, 50, 50, 0.9)";
        ctx.shadowColor = "#ff3030";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(hz.x * CELL + CELL / 2, hz.y * CELL + CELL / 2, CELL / 4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#ff4d1f";
      ctx.shadowColor = "#ff4d1f";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(sub.x * CELL + CELL / 2, sub.y * CELL + CELL / 2, CELL / 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    function endRun() {
      setRunLevel(currentLevelRef.current);
      setGameState("dead");
      setLevel(1);
    }

    animFrameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameState, level, bestLevel, isWall]);

  const canvasW = canvasDims.w;
  const canvasH = canvasDims.h;

  // Find player rank after submission
  const playerRank = submitted
    ? leaderboard.findIndex((e) => e.name === (nameInput.trim() || "Anon") && e.level === runLevel) + 1
    : 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Game */}
      <div className="flex-1 space-y-4">
        <div className="flex items-baseline justify-between font-mono text-sm flex-wrap gap-4">
          <span className="text-[var(--color-muted)] uppercase tracking-wider text-xs">
            Level: <span className="text-[var(--color-fg)] tabular-nums">{level}</span>
          </span>
          <span className="text-[var(--color-muted)] uppercase tracking-wider text-xs">
            Time: <span className="text-[var(--color-fg)] tabular-nums">{timeLeft.toFixed(1)}s</span>
          </span>
          <span className="text-[var(--color-muted)] uppercase tracking-wider text-xs">
            Best: <span className="text-[var(--color-accent)] tabular-nums">{bestLevel}</span>
          </span>
        </div>

        <div className="relative inline-block w-full">
          <canvas
            ref={canvasRef}
            width={canvasW}
            height={canvasH}
            className="w-full rounded-lg border border-[var(--color-border)]"
            style={{ aspectRatio: `${canvasW}/${canvasH}` }}
          />
          {gameState !== "playing" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
              <div className="text-center text-white px-6 w-full max-w-xs">
                {gameState === "idle" && (
                  <>
                    <p className="display-type text-3xl mb-2">Maze Run</p>
                    <p className="font-mono text-xs uppercase tracking-wider opacity-70 mb-1">Reach the green dot</p>
                    <p className="font-mono text-xs uppercase tracking-wider opacity-70 mb-6">Dodge the red ones</p>
                    <button
                      onClick={startGame}
                      className="px-6 py-3 bg-white text-black rounded-full font-medium text-sm hover:bg-[#ff4d1f] hover:text-white transition-colors"
                    >
                      Start
                    </button>
                  </>
                )}
                {gameState === "won" && (
                  <>
                    <p className="display-type text-4xl mb-2">Level {level} cleared</p>
                    <p className="font-mono text-xs uppercase tracking-wider opacity-70 mb-6">
                      {timeLeft.toFixed(1)}s remaining
                    </p>
                    <button
                      onClick={nextLevel}
                      className="px-6 py-3 bg-white text-black rounded-full font-medium text-sm hover:bg-[#ff4d1f] hover:text-white transition-colors"
                    >
                      Level {level + 1}
                    </button>
                  </>
                )}
                {gameState === "dead" && (
                  <>
                    <p className="display-type text-4xl mb-1">Run ended</p>
                    <p className="font-mono text-xs uppercase tracking-wider opacity-70 mb-5">
                      Reached level {runLevel}
                    </p>

                    {!submitted ? (
                      <div className="mb-5">
                        <p className="font-mono text-[10px] uppercase tracking-wider opacity-60 mb-2">
                          Post to leaderboard
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value.slice(0, 16))}
                            onKeyDown={(e) => { if (e.key === "Enter") handleSubmitScore(); }}
                            placeholder="Your name"
                            maxLength={16}
                            className="flex-1 px-3 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-mono placeholder:opacity-40 focus:outline-none focus:border-white/50"
                          />
                          <button
                            onClick={handleSubmitScore}
                            className="px-4 py-2 bg-white text-black rounded-full font-medium text-sm hover:bg-[#ff4d1f] hover:text-white transition-colors whitespace-nowrap"
                          >
                            Submit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="font-mono text-xs uppercase tracking-wider text-[#22c55e] mb-5">
                        #{playerRank} on the board
                      </p>
                    )}

                    <button
                      onClick={startGame}
                      className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-full font-medium text-sm hover:bg-white hover:text-black transition-colors"
                    >
                      Run again
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile controls */}
        <div className="md:hidden grid grid-cols-3 gap-2 max-w-xs mx-auto pt-4">
          <div />
          <button onClick={() => tryDir("up")} className="aspect-square rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-fg)] hover:text-[var(--color-bg)] transition-colors text-2xl">↑</button>
          <div />
          <button onClick={() => tryDir("left")} className="aspect-square rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-fg)] hover:text-[var(--color-bg)] transition-colors text-2xl">←</button>
          <button onClick={() => tryDir("down")} className="aspect-square rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-fg)] hover:text-[var(--color-bg)] transition-colors text-2xl">↓</button>
          <button onClick={() => tryDir("right")} className="aspect-square rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-fg)] hover:text-[var(--color-bg)] transition-colors text-2xl">→</button>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="lg:w-52 shrink-0">
        <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted)]">Leaderboard</p>
          </div>
          {leaderboard.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="font-mono text-[11px] text-[var(--color-muted)]">No runs yet.</p>
              <p className="font-mono text-[10px] text-[var(--color-muted)] mt-1 opacity-60">Be the first.</p>
            </div>
          ) : (
            <ol className="divide-y divide-[var(--color-border)]">
              {leaderboard.map((entry, i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className="font-mono text-[11px] w-5 shrink-0 tabular-nums"
                    style={{ color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#a16207" : "var(--color-muted)" }}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-[12px] text-[var(--color-fg)]">{entry.name}</span>
                  <span className="font-mono text-[11px] text-[var(--color-accent)] tabular-nums shrink-0">
                    L{entry.level}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

function applyDir(p: Pos, dir: Dir): Pos {
  if (dir === "up") return { x: p.x, y: p.y - 1 };
  if (dir === "down") return { x: p.x, y: p.y + 1 };
  if (dir === "left") return { x: p.x - 1, y: p.y };
  if (dir === "right") return { x: p.x + 1, y: p.y };
  return p;
}
