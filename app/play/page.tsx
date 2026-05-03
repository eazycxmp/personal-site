import Link from "next/link";

const GAMES = [
  {
    slug: "run",
    title: "Maze Run",
    tag: "Reflex · Speed",
    body: "A small dot runs through a maze. Speed increases the longer you survive. Get hit by a wall and it's over. Beat the high score.",
    status: "Live",
  },
];

export default function Play() {
  return (
    <div className="max-w-6xl mx-auto px-6 pt-20 pb-32">
      <div className="mb-16">
        <p className="font-mono text-sm text-[var(--color-muted)] uppercase tracking-wider mb-4">Interactive sandbox</p>
        <h1 className="display-type text-5xl md:text-7xl font-medium mb-6 max-w-3xl leading-[1.05]">
          Play
        </h1>
        <p className="text-lg md:text-xl text-[var(--color-muted)] max-w-2xl leading-relaxed">
          Small interactive things I&apos;ve built. Less business, more fun. Click through.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {GAMES.map((game) => (
          <Link
            key={game.slug}
            href={`/play/${game.slug}`}
            className="group block p-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-fg)] hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-baseline justify-between mb-4">
              <p className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider">{game.tag}</p>
              <span className="font-mono text-xs text-[var(--color-accent)] uppercase tracking-wider">{game.status}</span>
            </div>
            <h2 className="display-type text-3xl font-medium mb-3">{game.title}</h2>
            <p className="text-sm text-[var(--color-muted)] leading-relaxed mb-6">{game.body}</p>
            <span className="inline-flex items-center gap-1 text-sm font-medium">
              Play →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}