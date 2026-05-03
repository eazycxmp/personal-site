const ITEMS = [
  "n8n",
  "·",
  "Clay",
  "·",
  "HubSpot",
  "·",
  "Claude API",
  "·",
  "Apollo",
  "·",
  "Instantly",
  "·",
  "Python",
  "·",
  "Next.js",
  "·",
  "Sony A7III",
  "·",
  "Premiere",
  "·",
];

export function Marquee() {
  return (
    <div className="border-y border-[var(--color-fg)] bg-[var(--color-fg)] text-[var(--color-bg)] py-5 overflow-hidden my-12">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS].map((item, i) => (
          <span key={i} className="display-type text-3xl md:text-4xl mx-6 font-medium">
            {item === "·" ? <span className="text-[var(--color-accent)]">·</span> : item}
          </span>
        ))}
      </div>
    </div>
  );
}
