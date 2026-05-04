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
  title: "HomeLight — Espen Campbell",
  description:
    "Took over collections, then support. Data confirmation 5→60%, $100K newly-forecastable pipeline, 55% drop in support ticket volume.",
};

export default function HomeLightPage() {
  const cs = getCaseStudy("homelight")!;
  return (
    <>
      <Nav />
      <main className="max-w-screen-xl mx-auto">
        <CaseStudyHeader cs={cs} />

        <PhaseHeader phase="PHASE 1 / COLLECTIONS" title="Automating data confirmation on real estate listings." />

        <div className="px-5 md:px-8 pb-6 grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <StatCard label="DATA CONFIRMATION" value="5 → 60%" caption="listings confirmed" />
          <StatCard label="PIPELINE FORECAST" value="+$100K" caption="newly-visible" />
          <StatCard label="DEALS RECOVERED" value="$85K" caption="stuck or lagged" />
          <StatCard label="MANUAL TASKS" value="−70%" caption="automated away" />
        </div>

        <BodyRow label="WHAT I BUILT">
          Took over the collections team and rebuilt the listings data confirmation process from
          manual outreach into automated email workflows. The system pulled listing data,
          identified gaps, sent confirmation requests with structured response capture, and wrote
          results back to HubSpot. Confirmed listings rose from 5% to 60%, surfacing $100K in
          pipeline that had been invisible. Audited stuck deals and recovered $85K that was sitting
          in lagged stages. Manual collections work dropped 70% — the team shifted from chasing
          data to high-value touchpoints.
        </BodyRow>

        <div className="mx-5 md:mx-8 border-t border-black/10" />

        <PhaseHeader phase="PHASE 2 / SUPPORT" title="Cutting ticket volume, raising response accuracy." />

        <div className="px-5 md:px-8 pb-6 grid grid-cols-3 gap-2.5">
          <StatCard label="TICKET VOLUME" value="−55%" caption="spam & no-action filtered" />
          <StatCard label="RESPONSE ACCURACY" value="+40%" caption="via curated snippets" />
          <StatCard label="TIME PER TICKET" value="−60%" caption="avg handle time" />
        </div>

        <BodyRow label="WHAT I BUILT">
          With collections stable, I moved to support. Built automation that triaged spam and
          no-action-needed tickets out of the queue, dropping volume 55%. Created a library of
          curated HubSpot snippets matched to the questions support actually got asked, raising
          response accuracy by 40% and cutting average handle time by 60%. Support stopped re-typing
          the same answers and started doing real work.
          <ToolPills tools={["HubSpot", "n8n", "Claude API", "Snippets", "Workflow automation"]} />
        </BodyRow>

        <CaseStudyFooter cs={cs} />
      </main>
      <Footer />
    </>
  );
}
