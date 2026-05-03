import Link from "next/link";

type Project = {
  name: string;
  role: string;
  body: string;
  href: string;
  external: boolean;
  gradient: string;
};

const PROJECTS: Project[] = [
  {
    name: "HomeLight",
    role: "AI Product · RevOps",
    body: "Building AI-driven product surfaces and the systems that move money through the funnel. Internal builder role. Day job.",
    href: "https://homelight.com",
    external: true,
    gradient: "linear-gradient(135deg, #ff4d1f 0%, #b91c1c 50%, #1a1a1a 100%)",
  },
  {
    name: "Vortex Unlimited",
    role: "Hybrid athlete · Content",
    body: "My personal channel. Trail running, climbing, rugby, travel — filmed and cut with the same care I put into the GTM work. Started as Vortex Rugby, evolved into this.",
    href: "/studio",
    external: false,
    gradient: "linear-gradient(135deg, #facc15 0%, #ea580c 50%, #1a1a1a 100%)",
  },
  {
    name: "GTM systems",
    role: "Open-source · Three tools",
    body: "Building deliverability, outbound, and CRM hygiene tools in public. Each one a real working piece of infrastructure with a case study attached.",
    href: "/work",
    external: false,
    gradient: "linear-gradient(135deg, #1e3a8a 0%, #0c4a6e 50%, #0a0a0a 100%)",
  },
];

const NOISE = "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";

export function WorkingOn() {
  return (
    <section className="mb-24">
      <div className="flex items-baseline justify-between mb-10">
        <h2 className="display-type text-4xl md:text-5xl font-medium">Working on</h2>
        <span className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider">Three projects</span>
      </div>
      <div className="space-y-6">
        {PROJECTS.map((p, i) => {
          const Wrapper = p.external ? "a" : Link;
          const linkProps = p.external
            ? { href: p.href, target: "_blank" as const, rel: "noopener noreferrer" }
            : { href: p.href };
          return (
            <Wrapper key={p.name} {...linkProps} className="group block rounded-2xl overflow-hidden relative hover:-translate-y-1 transition-transform duration-300" style={{ background: p.gradient }}>
              <div className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none" style={{ backgroundImage: NOISE }} />
              <div className="relative grid md:grid-cols-12 gap-6 items-start p-7 md:p-9 text-white">
                <div className="md:col-span-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest opacity-60 mb-3">{String(i + 1).padStart(2, "0")} / 03</p>
                  <h3 className="display-type text-3xl md:text-4xl font-medium mb-2 leading-[1.05]">{p.name}</h3>
                  <p className="font-mono text-xs uppercase tracking-wider opacity-70">{p.role}</p>
                </div>
                <p className="md:col-span-7 text-base md:text-lg leading-relaxed opacity-90">{p.body}</p>
                <div className="md:col-span-1 flex md:justify-end items-start">
                  <span className="font-mono text-2xl opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
                </div>
              </div>
            </Wrapper>
          );
        })}
      </div>
    </section>
  );
}