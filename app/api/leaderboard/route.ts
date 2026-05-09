import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

type Entry = { name: string; level: number; date: string };

const KEY = "maze:leaderboard";

export async function GET() {
  try {
    const data = await kv.get<Entry[]>(KEY);
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const { name, level } = (await req.json()) as { name: string; level: number };
    const current = (await kv.get<Entry[]>(KEY)) ?? [];
    const entry: Entry = {
      name: String(name || "Anon").slice(0, 12),
      level: Number(level),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
    const updated = [...current, entry]
      .sort((a, b) => b.level - a.level)
      .slice(0, 10);
    await kv.set(KEY, updated);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
