export type CaseStudy = {
  slug: string;
  number: string; // "01 / 04"
  client: string;
  scope: string;
  role: string;
  category: string; // "REVOPS · AUTOMATION"
  gradientClass: string; // "grad-1" | "grad-2" | "grad-3" | "grad-4"
  cardSummary: string; // for home page card
  metrics: { v: string; l: string }[]; // 3 key numbers for work index card
  title: string; // big serif headline
  intro: string; // paragraph under title
  next?: { slug: string; client: string; numberLabel: string };
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "homelight",
    number: "01 / 04",
    client: "HomeLight",
    scope: "Collections · Support",
    role: "RevOps · Automation",
    category: "REVOPS · AUTOMATION",
    gradientClass: "grad-1",
    cardSummary:
      "Took over collections, then support. Data confirmation 5→60%. $100K in newly-forecastable pipeline. 55% drop in support ticket volume.",
    metrics: [
      { v: "5→60%", l: "data confirmed" },
      { v: "+$100K", l: "pipeline surfaced" },
      { v: "−55%", l: "ticket volume" },
    ],
    title: "From inbox queue to\nforecastable pipeline.",
    intro:
      "HomeLight, a real estate technology platform, brought me in to fix a manual collections process. I rebuilt it. Then they handed me support, and I rebuilt that too.",
    next: { slug: "heimdall-power", client: "Heimdall Power", numberLabel: "NEXT CASE · 02 / 04" },
  },
  {
    slug: "heimdall-power",
    number: "02 / 04",
    client: "Heimdall Power",
    scope: "Outbound · Pipeline",
    role: "Sales Operations",
    category: "OUTBOUND · AI SCORING",
    gradientClass: "grad-2",
    cardSummary:
      "Outbound engine with Instantly + Clay + Claude API into HubSpot. AI lead scoring from call transcripts. 6 pilots, $300K forecasted.",
    metrics: [
      { v: "6", l: "pilots landed" },
      { v: "$300K", l: "forecasted" },
      { v: "+40%", l: "VP sales output" },
    ],
    title: "Selling smart-grid hardware\nwith an AI-scored funnel.",
    intro:
      "Heimdall Power, a Norwegian smart-grid sensor company, sells power-line meters to utilities. I built the outbound and pipeline system that found the right buyers and showed sales which conversations were real.",
    next: { slug: "gowins-tile", client: "Gowins Tile", numberLabel: "NEXT CASE · 03 / 04" },
  },
  {
    slug: "gowins-tile",
    number: "03 / 04",
    client: "Gowins Tile",
    scope: "Inbound · Quoting",
    role: "Build · Handoff",
    category: "CONTRACTOR · INBOUND",
    gradientClass: "grad-3",
    cardSummary:
      "Inbound forms wired to JobTread quoting and Calendar. 120% more booked calls. $40K in new business in 90 days.",
    metrics: [
      { v: "+120%", l: "booked calls" },
      { v: "$40K", l: "new business" },
      { v: "90", l: "days to result" },
    ],
    title: "Turning a tile contractor's\ninbox into a sales engine.",
    intro:
      "Gowins Tile, a Bay Area tile and stone contractor, was losing leads in the gap between website forms and quotes. I rebuilt the path from form to booked estimate.",
    next: { slug: "vortex-rugby", client: "Vortex Rugby", numberLabel: "NEXT CASE · 04 / 04" },
  },
  {
    slug: "vortex-rugby",
    number: "04 / 04",
    client: "Vortex Rugby",
    scope: "Outbound · Branding",
    role: "Growth · GTM",
    category: "SPORTS · GTM",
    gradientClass: "grad-4",
    cardSummary:
      "Prospected 560 rugby clubs. Built brand and GTM from scratch. Grew from $10K to $50K in year one — 2-person team, no agency.",
    metrics: [
      { v: "560", l: "clubs prospected" },
      { v: "5×", l: "revenue growth" },
      { v: "2", l: "person team" },
    ],
    title: "Taking a rugby brand\nfrom zero to $50K.",
    intro:
      "Vortex Rugby built gear and apparel for clubs and athletes. In year one I built the GTM playbook, prospected 560 teams across the country, and helped grow revenue from $10K to $50K — with a two-person team and no outside agency.",
    next: { slug: "homelight", client: "HomeLight", numberLabel: "BACK TO START · 01 / 04" },
  },
];

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((c) => c.slug === slug);
}
