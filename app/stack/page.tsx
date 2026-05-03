import { ToolIcon } from "@/components/tool-icon";

const STACK = [
  {
    category: "CRM",
    tools: [
      { name: "HubSpot", slug: "hubspot" },
      { name: "Salesforce", slug: "salesforce" },
    ],
  },
  {
    category: "Outbound",
    tools: [
      { name: "Instantly", slug: null },
      { name: "Smartlead", slug: null },
      { name: "Customer.io", slug: "customerio" },
    ],
  },
  {
    category: "Enrichment",
    tools: [
      { name: "Apollo", slug: "apollo-graphql" },
      { name: "Clay", slug: null },
      { name: "Hunter", slug: null },
    ],
  },
  {
    category: "Automation",
    tools: [
      { name: "n8n", slug: "n8n" },
      { name: "Zapier", slug: "zapier" },
      { name: "Make", slug: "make" },
    ],
  },
  {
    category: "Dev",
    tools: [
      { name: "Python", slug: "python" },
      { name: "Next.js", slug: "nextdotjs" },
      { name: "Claude API", slug: "anthropic" },
      { name: "Vercel", slug: "vercel" },
      { name: "GitHub", slug: "github" },
    ],
  },
  {
    category: "Content",
    tools: [
      { name: "Sony A7III", slug: "sony" },
      { name: "Adobe Premiere", slug: "adobepremierepro" },
      { name: "Adobe Lightroom", slug: "adobelightroom" },
      { name: "DJI", slug: "dji" },
    ],
  },
];

export default function Stack() {
  return (
    <div className="max-w-6xl mx-auto px-6 pt-20 pb-32">
      <div className="mb-16">
        <p className="font-mono text-sm text-[var(--color-muted)] uppercase tracking-wider mb-4">The tools</p>
        <h1 className="display-type text-5xl md:text-7xl font-medium mb-6 max-w-3xl leading-[1.05]">
          Stack
        </h1>
        <p className="text-lg md:text-xl text-[var(--color-muted)] max-w-2xl leading-relaxed">
          The tools I actually use, organized by what they do. If a tool is here, I&apos;ve shipped real work with it. No tourists.
        </p>
      </div>

      <div className="space-y-16">
        {STACK.map((section) => (
          <section key={section.category}>
            <div className="flex items-baseline justify-between mb-6 border-b border-[var(--color-border)] pb-3">
              <h2 className="display-type text-2xl md:text-3xl font-medium">{section.category}</h2>
              <span className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider">{section.tools.length} tools</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {section.tools.map((tool) => (
                <ToolIcon key={tool.name} name={tool.name} slug={tool.slug} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
