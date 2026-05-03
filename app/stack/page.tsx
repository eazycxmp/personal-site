import { ToolIcon } from "@/components/tool-icon";

type StackSection = {
  category: string;
  description: string;
  gradient: string;
  tools: { name: string; slug: string | null; domain?: string | null; iconUrl?: string | null }[];
};

const STACK: StackSection[] = [
  {
    category: "CRM",
    description: "Where the data lives",
    gradient: "linear-gradient(135deg, #ff4d1f 0%, #b91c1c 50%, #1a1a1a 100%)",
    tools: [
      { name: "HubSpot", slug: "hubspot", domain: "hubspot.com" },
      { name: "Salesforce", slug: null, domain: "salesforce.com", iconUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg" },
    ],
  },
  {
    category: "Outbound",
    description: "Sending engines and warming",
    gradient: "linear-gradient(135deg, #facc15 0%, #ea580c 50%, #1a1a1a 100%)",
    tools: [
      { name: "Instantly", slug: null, domain: "instantly.ai" },
      { name: "Smartlead", slug: null, domain: "smartlead.ai" },
      { name: "Customer.io", slug: null, domain: "customer.io" },
    ],
  },
  {
    category: "Enrichment",
    description: "Sourcing and data quality",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #1e3a8a 50%, #0a0a0a 100%)",
    tools: [
      { name: "Apollo", slug: null, domain: "apollo.io" },
      { name: "Clay", slug: null, domain: "clay.com" },
      { name: "Hunter", slug: null, domain: "hunter.io" },
    ],
  },
  {
    category: "Automation",
    description: "Where the workflows run",
    gradient: "linear-gradient(135deg, #a855f7 0%, #6b21a8 50%, #1a1a1a 100%)",
    tools: [
      { name: "n8n", slug: "n8n", domain: "n8n.io" },
      { name: "Zapier", slug: "zapier", domain: "zapier.com" },
      { name: "Make", slug: "make", domain: "make.com" },
    ],
  },
  {
    category: "Dev",
    description: "Building and shipping",
    gradient: "linear-gradient(135deg, #14b8a6 0%, #0f766e 50%, #0a0a0a 100%)",
    tools: [
      { name: "Python", slug: "python", domain: "python.org" },
      { name: "Next.js", slug: "nextdotjs", domain: "nextjs.org" },
      { name: "Claude", slug: "anthropic", domain: "anthropic.com" },
      { name: "Vercel", slug: "vercel", domain: "vercel.com" },
      { name: "GitHub", slug: "github", domain: "github.com" },
    ],
  },
  {
    category: "Content",
    description: "Filming and post",
    gradient: "linear-gradient(135deg, #ec4899 0%, #9d174d 50%, #1a1a1a 100%)",
    tools: [
      { name: "Sony", slug: null, domain: "sony.com", iconUrl: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg" },
      { name: "Premiere", slug: null, domain: "adobe.com", iconUrl: "https://upload.wikimedia.org/wikipedia/commons/4/40/Adobe_Premiere_Pro_CC_icon.svg" },
      { name: "Lightroom", slug: null, domain: "adobe.com", iconUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b6/Adobe_Photoshop_Lightroom_CC_logo.svg" },
      { name: "DJI", slug: "dji", domain: "dji.com" },
    ],
  },
];

const NOISE = "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";

export default function Stack() {
  return (
    <div className="max-w-6xl mx-auto px-6 pt-20 pb-32">
      <div className="mb-16">
        <p className="font-mono text-sm text-[var(--color-muted)] uppercase tracking-wider mb-4">The tools</p>
        <h1 className="display-type text-5xl md:text-7xl font-medium mb-6 max-w-3xl leading-[1.05]">Stack</h1>
        <p className="text-lg md:text-xl text-[var(--color-muted)] max-w-2xl leading-relaxed">
          The tools I actually use, organized by what they do. If a tool is here, I&apos;ve shipped real work with it. No tourists.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {STACK.map((section, i) => (
          <article key={section.category} className="rounded-2xl overflow-hidden relative group hover:-translate-y-1 transition-transform duration-300" style={{ background: section.gradient }}>
            <div className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none" style={{ backgroundImage: NOISE }} />
            <div className="relative p-7 md:p-8 text-white">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest opacity-60 mb-2">{String(i + 1).padStart(2, "0")} / {String(STACK.length).padStart(2, "0")}</p>
                  <h2 className="display-type text-3xl md:text-4xl font-medium mb-1 leading-tight">{section.category}</h2>
                  <p className="font-mono text-xs uppercase tracking-wider opacity-70">{section.description}</p>
                </div>
                <span className="font-mono text-xs opacity-60">{section.tools.length} tools</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {section.tools.map((tool) => (
                  <ToolIcon key={tool.name} name={tool.name} slug={tool.slug} domain={tool.domain ?? null} iconUrl={tool.iconUrl ?? null} />
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
