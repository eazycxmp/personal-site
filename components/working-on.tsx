import Link from "next/link";

const PROJECTS = [
  {
    name: "HomeLight",
    role: "AI Product · RevOps",
    body: "Building AI-driven product surfaces and the systems that move money through the funnel. Internal builder role. Day job.",
    href: "https://homelight.com",
    external: true,
  },
  {
    name: "Vortex Unlimited",
    role: "Hybrid athlete · Content",
    body: "My personal channel. Trail running, climbing, rugby, travel — filmed and cut with the same care I put into the GTM work. Started as Vortex Rugby, evolved into this.",
    href: "/studio",
    external: false,
  },
  {
    name: "GTM systems",
    role: "Open-source · Three tools",
    body: "Building deliverability, outbound, and CRM hygiene tools in public. Each one a real working piece of infrastructure with a case study attached.",
    href: "/work",
    external: false,
  },
];

export function WorkingOn() {
  return (
    <section className="mb-24">
      <div className="flex items-baseline justify-between mb-8">
        <h2 className="display-type text-4xl md:text-5xl font-medium">Working on</h2>
        <span className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider">Three projects</span>
      </div>
      <div className="border-t border-[var(--color-fg)]">
        {PROJECTS.map((p) => {
          const Wrapper = p.external ? "a" : Link;
          const linkProps = p.external
            ? { href: p.href, target: "_blank" as const, rel: "noopener noreferrer" }
            : { href: p.href };
          return (
            <Wrapper key={p.name} {...linkProps} className="group block py-8 border-b border-[var(--color-border)] hover:bg-[var(--color-card)] transition-colors -mx-4 md:-mx-6 px-4 md:px-6">
              <div className="grid grid-cols-12 gap-6 items-baseline">
                <div className="col-span-12 md:col-span-4">
                  <h3 className="display-type text-2xl md:text-3xl font-medium mb-1">{p.name}</h3>
                  <p className="font-mono text-xs uppercase tracking-wider text-[var(--color-muted)]">{p.role}</p>
                </div>
                <p className="col-span-12 md:col-span-7 text-base md:text-lg text-[var(--color-muted)] leading-relaxed">{p.body}</p>
                <div className="col-span-12 md:col-span-1 flex md:justify-end">
                  <span className="font-mono text-xl text-[var(--color-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-1 transition-all">→</span>
                </div>
              </div>
            </Wrapper>
          );
        })}
      </div>
    </section>
  );
}
