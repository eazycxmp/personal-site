import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import {
  CaseStudyHeader,
  CaseStudyFooter,
  StatCard,
  BodyRow,
  ToolPills,
} from "@/components/case-study-parts";
import { getCaseStudy } from "@/lib/case-studies";

export const metadata = {
  title: "Heimdall Power — Espen Campbell",
  description:
    "Outbound and AI-scored pipeline for a Norwegian smart-grid sensor company. 6 utility pilots, $300K forecasted.",
};

export default function HeimdallPage() {
  const cs = getCaseStudy("heimdall-power")!;
  return (
    <>
      <Nav />
      <main className="max-w-screen-xl mx-auto">
        <CaseStudyHeader cs={cs} />

        <div className="px-5 md:px-8 pt-7 pb-6 grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <StatCard label="PILOTS LANDED" value="6" caption="utility partners" />
          <StatCard label="PILOT LENGTH" value="3 → 6 mo" caption="contract value 2x" />
          <StatCard label="VP SALES OUTPUT" value="+40%" caption="calls per week" />
          <StatCard label="PIPELINE FORECAST" value="$300K" caption="net-new tracked" />
        </div>

        <BodyRow label="THE PROBLEM">
          Heimdall sells highly technical hardware — sensors that measure how much power can safely
          flow through a transmission line — to a small global pool of utility buyers. Outbound was
          scattered, prospect signal was qualitative, and the VP of Sales was the bottleneck on
          every meaningful conversation.
        </BodyRow>

        <BodyRow label="WHAT I BUILT">
          An end-to-end outbound and scoring engine. Instantly handled sending and warm-up. Clay
          enriched and segmented utility prospects globally. Claude API personalized outreach by
          region and grid context. HubSpot held the source of truth. The novel layer: Fathom
          recorded every sales call, Claude API parsed the transcripts to score interest signal per
          prospect, and that score wrote back to HubSpot to drive pipeline ranking and follow-up
          sequencing. Auto-notes from each call landed in the right contact record without anyone
          retyping anything.
          <ToolPills tools={["Instantly", "Clay", "Claude API", "HubSpot", "Fathom", "n8n"]} />
        </BodyRow>

        <BodyRow label="THE OUTCOME">
          6 utility pilots landed. Pilot length extended from 3 to 6 months, doubling contract
          value per deal. The VP of Sales made 40% more calls per week with auto-notes feeding
          HubSpot in the background, freeing him from admin. With clean pipeline data we
          forecasted $300K in net-new revenue with confidence — the first time the sales org could
          plan against numbers it trusted.
        </BodyRow>

        <CaseStudyFooter cs={cs} />
      </main>
      <Footer />
    </>
  );
}
