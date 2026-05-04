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
  title: "Gowins Tile — Espen Campbell",
  description:
    "Inbound forms wired to JobTread quoting and Calendar. 120% more booked calls, $40K in new business in 90 days.",
};

export default function GowinsPage() {
  const cs = getCaseStudy("gowins-tile")!;
  return (
    <>
      <Nav />
      <main className="max-w-screen-xl mx-auto">
        <CaseStudyHeader cs={cs} />

        <div className="px-5 md:px-8 pt-7 pb-6 grid grid-cols-3 gap-2.5">
          <StatCard label="BOOKED CALLS" value="+120%" caption="vs. prior 90 days" />
          <StatCard label="NEW REVENUE" value="$40K" caption="attributable in 90 days" />
          <StatCard label="MANUAL STEPS" value="→ 0" caption="form to booked estimate" />
        </div>

        <BodyRow label="THE PROBLEM">
          Inbound was strong. Conversion was not. Leads filled out a contact form on the Gowins
          Tile site and then sat in an inbox until Jack could read them, qualify them, and reach
          out to schedule. Hot leads went cold in 24-48 hours. There was no view of the pipeline,
          no follow-up logic, and no way to know which marketing was actually working.
        </BodyRow>

        <BodyRow label="WHAT I BUILT">
          One n8n workflow that listens to form submissions, enriches each lead with property and
          project data, classifies the job type, and routes to the right next step. Qualified leads
          get an instant Calendar invite for an estimate. Lower-fit leads get a tailored email with
          a self-serve quote link to JobTread. Everything writes back to a single source of truth
          Jack can read in under thirty seconds each morning.
          <ToolPills tools={["n8n", "JobTread API", "Gmail API", "Google Calendar", "Claude API"]} />
        </BodyRow>

        <BodyRow label="THE OUTCOME">
          In the first 90 days, Gowins Tile booked 120% more estimate calls than the prior quarter
          and closed $40K in new business directly attributable to the system. Jack&apos;s inbox went
          from a queue to a dashboard. The system runs without me.
        </BodyRow>

        {/* Pull quote — Jack */}
        <div className="mx-5 md:mx-8 mb-9 p-6 md:p-8 bg-[var(--color-ink)] rounded-[10px] text-[var(--color-cream)]">
          <p className="serif-display italic text-[18px] md:text-[24px] leading-[1.3] mb-5">
            &ldquo;Espen organized our website forms and automations end-to-end. We booked 120%
            more calls and closed $40K in new business — without me touching the system.&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/15" />
            <div>
              <div className="text-[13px] font-medium">Jack Gowins</div>
              <div className="text-[11px] text-white/60">Founder, Gowins Tile</div>
            </div>
          </div>
        </div>

        <CaseStudyFooter cs={cs} />
      </main>
      <Footer />
    </>
  );
}
