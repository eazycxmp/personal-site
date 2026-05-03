import Link from "next/link";

type Service = {
  number: string;
  tag: string;
  title: string;
  body: string;
  href: string;
  gradient: string;
};

const SERVICES: Service[] = [
  {
    number: "01",
    tag: "Stack",
    title: "Custom GTM systems",
    body: "n8n workflows, Clay enrichment, HubSpot routing, AI personalization. Wired together end to end. No black boxes, no template traps.",
    href: "/work#systems",
    gradient: "linear-gradient(135deg, #ff4d1f 0%, #b91c1c 50%, #1a1a1a 100%)",
  },
  {
    number: "02",
    tag: "Audit",
    title: "Deliverability infrastructure",
    body: "SPF, DKIM, DMARC, sending domains, warm-up, monitoring. Get into the inbox and stay there. Free wedge audit available right here.",
    href: "/work#audit",
    gradient: "linear-gradient(135deg, #facc15 0%, #ea580c 50%, #1a1a1a 100%)",
  },
  {
    number: "03",
    tag: "Maintain",
    title: "CRM hygiene and routing",
    body: "Dedup, enrichment fill, lead scoring, owner routing, drift alerts. Stop your CRM from quietly rotting in the background.",
    href: "/work#hygiene",
    gradient: "linear-gradient(135deg, #1e3a8a 0%, #0c4a6e 50%, #0a0a0a 100%)",
  },
];

const NOISE = "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";

export function ServiceCards() {
  return (
    <section className="my-24">
      <div className="flex items-baseline justify-between mb-10">
        <h2 className="display-type text-4xl md:text-5xl font-medium">What I build</h2>
        <span className="font-mono text-xs text-[var(--color-muted)] uppercase tracking-wider">Three practices</span>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {SERVICES.map((service) => (
          <Link key={service.number} href={service.href} className="group block rounded-2xl overflow-hidden relative aspect-[3/4] hover:-translate-y-1 transition-transform duration-300" style={{ background: service.gradient }}>
            <div className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none" style={{ backgroundImage: NOISE }} />
            <div className="relative h-full flex flex-col justify-between p-6 md:p-7 text-white">
              <div className="flex items-start justify-between">
                <p className="font-mono text-xs uppercase tracking-widest opacity-70">{service.tag}</p>
                <p className="font-mono text-xs opacity-60">{service.number}</p>
              </div>
              <div>
                <h3 className="display-type text-2xl md:text-3xl font-medium mb-3 leading-tight">{service.title}</h3>
                <p className="text-sm opacity-80 leading-relaxed mb-4">{service.body}</p>
                <span className="inline-flex items-center gap-1 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">Read more →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}