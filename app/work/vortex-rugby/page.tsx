import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import {
  CaseStudyHeader,
  CaseStudyFooter,
  StatCard,
  PhaseHeader,
  BodyRow,
  ToolPills,
} from "@/components/case-study-parts";
import { getCaseStudy } from "@/lib/case-studies";

export const metadata = {
  title: "Vortex Rugby — Espen Campbell",
  description:
    "Prospected 560 rugby clubs. Built brand and GTM from scratch. Grew from $10K to $50K in year one with a 2-person team.",
};

export default function VortexRugbyPage() {
  const cs = getCaseStudy("vortex-rugby")!;
  return (
    <>
      <Nav />
      <main className="max-w-screen-xl mx-auto">
        <CaseStudyHeader cs={cs} />

        <div className="px-5 md:px-8 pt-7 pb-6 grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <StatCard label="CLUBS PROSPECTED" value="560" caption="across the US" />
          <StatCard label="REVENUE GROWTH" value="5×" caption="$10K → $50K year one" />
          <StatCard label="TEAM SIZE" value="2" caption="no agency, no budget" />
          <StatCard label="TIME TO RESULTS" value="12 mo" caption="full cycle" />
        </div>

        <BodyRow label="THE CONTEXT">
          Vortex Rugby is a sports apparel and gear brand built for rugby clubs and athletes.
          When I came on, the brand existed on paper — logo, some product — but there was no
          repeatable way to find customers, no outbound motion, and no system for turning
          interest into orders. It was a two-person operation with real ambition and no GTM
          infrastructure.
        </BodyRow>

        <div className="mx-5 md:mx-8 border-t border-black/10" />

        <PhaseHeader phase="PHASE 1 / OUTBOUND" title="Mapping and prospecting 560 rugby clubs." />

        <div className="px-5 md:px-8 pb-6 grid grid-cols-3 gap-2.5">
          <StatCard label="CLUBS MAPPED" value="560" caption="across US competition tiers" />
          <StatCard label="DECISION MAKERS" value="1,200+" caption="coaches and club managers" />
          <StatCard label="REPLY RATE" value="12%" caption="cold outreach average" />
        </div>

        <BodyRow label="WHAT I BUILT">
          Rugby has a clear, structured universe of buyers — clubs, teams, and coaches organized
          by competition tier and region. I mapped it. Built a prospect list of 560 clubs and
          their key decision-makers using manual research and enrichment tools, then wrote
          sequence copy matched to each tier (youth clubs, collegiate, senior men&apos;s and
          women&apos;s). Launched cold email and LinkedIn outreach. Reply rates hit 12%, well above
          the industry floor for cold outbound in a niche sport.
          <ToolPills tools={["Clay", "Apollo", "Instantly", "HubSpot", "LinkedIn"]} />
        </BodyRow>

        <div className="mx-5 md:mx-8 border-t border-black/10" />

        <PhaseHeader phase="PHASE 2 / BRAND + CONTENT" title="Building a brand that clubs wanted to wear." />

        <div className="px-5 md:px-8 pb-6 grid grid-cols-3 gap-2.5">
          <StatCard label="SOCIAL FOLLOWING" value="10×" caption="organic growth, year one" />
          <StatCard label="CONTENT PIECES" value="40+" caption="match recaps, athlete features" />
          <StatCard label="CLUB PARTNERSHIPS" value="8" caption="direct kit deals" />
        </div>

        <BodyRow label="WHAT I BUILT">
          Outbound gets attention; brand earns trust. I ran the content side of Vortex — match
          recaps, athlete spotlights, club stories — across Instagram and email. The goal was
          to make Vortex feel like it belonged in rugby, not like a vendor pitching it. Eight
          clubs signed direct kit partnerships in year one. Social grew 10× organically. The
          brand became recognizable inside the community we were selling to.
          <ToolPills tools={["Instagram", "Mailchimp", "Canva", "Capcut"]} />
        </BodyRow>

        <div className="mx-5 md:mx-8 border-t border-black/10" />

        <PhaseHeader phase="RESULTS" title="$10K to $50K. Two people. One year." />

        <BodyRow label="THE OUTCOME">
          By the end of year one, Vortex had gone from a standing start to $50K in revenue —
          5× growth — with no outside funding, no agency, and a two-person team. The
          outbound system ran without constant attention. The brand had a real following inside
          the sport. We had a repeatable playbook for adding new clubs each quarter. Everything
          was handed off documented and running.
        </BodyRow>

        <CaseStudyFooter cs={cs} />
      </main>
      <Footer />
    </>
  );
}
