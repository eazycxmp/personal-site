import { Instagram, Globe, ArrowUpRight } from "lucide-react";

type Project = {
  slug: string;
  name: string;
  tag: string;
  body: string;
  year: string;
  gradient: string;
  links: { type: "instagram" | "site"; label: string; href: string }[];
};

const PROJECTS: Project[] = [
  {
    slug: "vortex-unlimited",
    name: "Vortex Unlimited",
    tag: "Hybrid athlete content",
    body: "Where I started filming for me. Trail running, climbing, training, travel, etc.. ",
    year: "2025 — present",
    gradient: "linear-gradient(135deg, #ff4d1f 0%, #b91c1c 40%, #1a1a1a 100%)",
    links: [
      { type: "instagram", label: "vortex unlimited ig", href: "https://instagram.com/vortex.unlimited" },
    ],
  },
  {
    slug: "vortex-rugby",
    name: "Vortex Rugby",
    tag: "Apparel · Brand · Content",
    body: "Started this three years ago. Rugby lifestyle apparel, 5,000+ followers. Tournament coverage, kit drops, athlete profiles.",
    year: "2022 — present",
    gradient: "linear-gradient(135deg, #1e3a8a 0%, #0c4a6e 50%, #0a0a0a 100%)",
    links: [
      { type: "site", label: "vortexrugby site", href: "https://vortexrugby.com" },
      { type: "instagram", label: "vortex rugby ig", href: "https://instagram.com/vortex.rugby" },
    ],
  },
];

const NOISE_SVG = "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";

export default function Studio() {
  return (
    <div className="max-w-6xl mx-auto px-6 pt-20 pb-32">
      <div className="mb-20 max-w-3xl">
        <p className="font-mono text-sm text-[var(--color-muted)] uppercase tracking-wider mb-4">Creative practice</p>
        <h1 className="display-type text-6xl md:text-8xl font-medium mb-6 leading-[0.95]">Studio</h1>
        <p className="text-lg md:text-xl text-[var(--color-muted)] leading-relaxed">Video, photography, and content I make outside of GTM work. Two channels. Same camera. Same care.</p>
      </div>

      <div className="space-y-24 md:space-y-32">
        {PROJECTS.map((project, i) => {
          const isEven = i % 2 === 0;
          return (
            <article key={project.slug} className="group">
              <div className={`grid md:grid-cols-12 gap-8 md:gap-12 items-center ${isEven ? "" : "md:[&>*:first-child]:order-2"}`}>
                <div className="md:col-span-7">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden relative shadow-2xl group-hover:shadow-[0_25px_50px_-12px_rgba(255,77,31,0.35)] transition-all duration-500" style={{ background: project.gradient }}>
                    <div className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none" style={{ backgroundImage: NOISE_SVG }} />
                    <div className="absolute inset-0 flex items-end p-8 md:p-10">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-white/60 mb-2">{project.year}</p>
                        <h2 className="display-type text-4xl md:text-6xl font-medium text-white leading-[0.95]">{project.name}</h2>
                      </div>
                    </div>
                    <div className="absolute top-8 right-8 font-mono text-xs text-white/50 uppercase tracking-widest">{String(i + 1).padStart(2, "0")} / {String(PROJECTS.length).padStart(2, "0")}</div>
                  </div>
                </div>

                <div className="md:col-span-5 space-y-6">
                  <div>
                    <p className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider mb-3">{project.tag}</p>
                    <h3 className="display-type text-3xl md:text-4xl font-medium mb-5 leading-tight">{project.name}</h3>
                    <p className="text-base md:text-lg text-[var(--color-muted)] leading-relaxed">{project.body}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    {project.links.map((link) => {
                      const Icon = link.type === "instagram" ? Instagram : Globe;
                      return (
                        <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--color-fg)] text-sm font-medium hover:bg-[var(--color-fg)] hover:text-[var(--color-bg)] transition-colors">
                          <Icon size={14} />
                          {link.label}
                          <ArrowUpRight size={14} className="opacity-60" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-32 pt-12 border-t border-[var(--color-border)]">
        <p className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider mb-2">More to come</p>
        <p className="text-base md:text-lg text-[var(--color-muted)] max-w-2xl leading-relaxed">Working on travel pieces, hybrid athlete edits, and a few collabs in the pipeline. Follow along on Instagram or check back here.</p>
      </div>
    </div>
  );
}