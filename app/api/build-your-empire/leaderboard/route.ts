import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

type Entry = { name: string; value: number; date: string };
type Boards = { fed: Entry[]; empire: Entry[] };
type Board = keyof Boards;

const KEY = "buildyourempire:leaderboard";
// scores posted while the game was still called River Feast
const OLD_KEY = "riverfeast:leaderboard";
// guests fed counts up; minutes to reach Empire counts down
const LIMITS: Record<Board, [number, number]> = { fed: [1, 10_000_000], empire: [5, 100_000] };

async function read(): Promise<Boards> {
  const data = (await kv.get<Boards>(KEY)) ?? (await kv.get<Boards>(OLD_KEY));
  return { fed: data?.fed ?? [], empire: data?.empire ?? [] };
}

export async function GET() {
  try {
    return NextResponse.json(await read());
  } catch {
    return NextResponse.json({ fed: [], empire: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { name?: unknown; board?: unknown; value?: unknown };
    const board: Board | null = body.board === "fed" || body.board === "empire" ? body.board : null;
    const value = Math.round(Number(body.value));
    if (!board || !Number.isFinite(value) || value < LIMITS[board][0] || value > LIMITS[board][1]) {
      return NextResponse.json({ error: "bad score" }, { status: 400 });
    }
    const name = String(body.name ?? "").replace(/[^\p{L}\p{N} _.-]/gu, "").trim().slice(0, 12) || "Anon";
    const boards = await read();
    const entry: Entry = {
      name,
      value,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
    boards[board] = [...boards[board], entry]
      .sort((a, b) => (board === "fed" ? b.value - a.value : a.value - b.value))
      .slice(0, 10);
    await kv.set(KEY, boards);
    return NextResponse.json(boards);
  } catch {
    return NextResponse.json({ fed: [], empire: [] }, { status: 500 });
  }
}
