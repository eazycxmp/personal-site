import { MazeGame } from "@/components/maze-game";
import Link from "next/link";

export default function RunPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 pt-20 pb-32">
      <div className="mb-10">
        <Link href="/play" className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider hover:text-[var(--color-fg)] transition-colors">
          ← Play
        </Link>
        <h1 className="display-type text-5xl md:text-6xl font-medium mt-6 mb-4">
          Maze Run
        </h1>
        <p className="text-base md:text-lg text-[var(--color-muted)] max-w-2xl leading-relaxed">
          Use arrow keys or WASD on desktop. Tap directions on mobile. Speed increases every 10 seconds. Don&apos;t hit the walls.
        </p>
      </div>
      <MazeGame />
    </div>
  );
}