export type CaseStudy = {
  slug: string;
  number: string; // "01 / 03"
  client: string;
  scope: string;
  role: string;
  category: string; // "REVOPS · AUTOMATION"
  gradientClass: string; // "grad-1" | "grad-2" | "grad-3"
  cardSummary: string; // for home page card
  title: string; // big serif headline
  intro: string; // paragraph under title
  next?: { slug: string; client: string; numberLabel: string };
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "homelight",
    number: "01 / 03",
    client: "HomeLight",
    scope: "Collections · Support",
    role: "RevOps · Automation",
    category: "REVOPS · AUTOMATION",
    gradientClass: "grad-1",
    cardSummary:
      "Took over collections, then support. Data confirmation 5→60%. $100K in newly-forecastable pipeline. 55% drop in support ticket volume.",
    title: "From inbox queue to\nforecastable pipeline.",
    intro:
      "HomeLight, a real estate technology platform, brought me in to fix a manual collections process. I rebuilt it. Then they handed me support, and I rebuilt that too.",
    next: { slug: "heimdall-power", client: "Heimdall Power", numberLabel: "NEXT CASE · 02 / 03" },
  },
  {
    slug: "heimdall-power",
    number: "02 / 03",
    client: "Heimdall Power",
    scope: "Outbound · Pipeline",
    role: "Sales Operations",
    category: "OUTBOUND · AI SCORING",
    gradientClass: "grad-2",
    cardSummary:
      "Outbound engine with Instantly + Clay + Claude API into HubSpot. AI lead scoring from call transcripts. 6 pilots, $300K forecasted.",
    title: "Selling smart-grid hardware\nwith an AI-scored funnel.",
    intro:
      "Heimdall Power, a Norwegian smart-grid sensor company, sells power-line meters to utilities. I built the outbound and pipeline system that found the right buyers and showed sales which conversations were real.",
    next: { slug: "gowins-tile", client: "Gowins Tile", numberLabel: "NEXT CASE · 03 / 03" },
  },
  {
    slug: "gowins-tile",
    number: "03 / 03",
    client: "Gowins Tile",
    scope: "Inbound · Quoting",
    role: "Build · Handoff",
    category: "CONTRACTOR · INBOUND",
    gradientClass: "grad-3",
    cardSummary:
      "Inbound forms wired to JobTread quoting and Calendar. 120% more booked calls. $40K in new business in 90 days.",
    title: "Turning a tile contractor's\ninbox into a sales engine.",
    intro:
      "Gowins Tile, a Bay Area tile and stone contractor, was losing leads in the gap between website forms and quotes. I rebuilt the path from form to booked estimate.",
    next: { slug: "homelight", client: "HomeLight", numberLabel: "BACK TO START · 01 / 03" },
  },
];

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((c) => c.slug === slug);
}
