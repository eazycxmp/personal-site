import Link from "next/link";
import { ReactNode } from "react";
import { ButtonPrimary } from "@/components/buttons";
import { siteConfig } from "@/lib/site-config";
import { CaseStudy } from "@/lib/case-studies";

export function CaseStudyHeader({ cs }: { cs: CaseStudy }) {
  return (
    <>
      <div className="px-5 md:px-8 pt-12 md:pt-14 pb-3">
        <div className="label-eyebrow mb-3.5">WORK / {cs.number}</div>
        <h1 className="serif-display text-[32px] md:text-[44px] leading-[1.05] mb-4 whitespace-pre-line">
          {cs.title}
        </h1>
        <p className="text-[13px] md:text-[14px] text-[var(--color-ink-soft)] leading-[1.6] md:max-w-[540px]">
          {cs.intro}
        </p>
      </div>
      <div className="mx-5 md:mx-8 mt-7 py-4 border-t border-b border-black/10 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
        <div>
          <div className="label-eyebrow mb-1">CLIENT</div>
          <div className="text-[13px] font-medium">{cs.client}</div>
        </div>
        <div>
          <div className="label-eyebrow mb-1">SCOPE</div>
          <div className="text-[13px] font-medium">{cs.scope}</div>
        </div>
        <div className="col-span-2 md:col-span-1">
          <div className="label-eyebrow mb-1">ROLE</div>
          <div className="text-[13px] font-medium">{cs.role}</div>
        </div>
      </div>
    </>
  );
}

export function StatCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="bg-white border border-black/10 rounded-[10px] p-4">
      <div className="label-eyebrow mb-2">{label}</div>
      <div className="serif-display text-[24px] md:text-[28px] leading-none text-[var(--color-accent)]">
        {value}
      </div>
      <div className="text-[10px] text-[var(--color-muted)] mt-1.5">{caption}</div>
    </div>
  );
}

export function PhaseHeader({
  phase,
  title,
}: {
  phase: string;
  title: string;
}) {
  return (
    <div className="px-5 md:px-8 pt-7 pb-3">
      <div className="label-eyebrow text-[var(--color-accent)] mb-2">{phase}</div>
      <div className="serif-display text-[22px] md:text-[26px] leading-[1.15]">{title}</div>
    </div>
  );
}

export function BodyRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="px-5 md:px-8 pb-7 grid grid-cols-1 md:grid-cols-[140px_1fr] gap-3 md:gap-8">
      <div className="label-eyebrow md:pt-1">{label}</div>
      <div className="text-[13px] md:text-[14px] leading-[1.7]">{children}</div>
    </div>
  );
}

export function ToolPills({ tools }: { tools: string[] }) {
  return (
    <div className="mt-3.5 flex flex-wrap gap-1.5">
      {tools.map((t) => (
        <span
          key={t}
          className="text-[11px] px-2.5 py-1 bg-[rgba(20,30,80,0.06)] rounded-full"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

export function CaseStudyFooter({ cs }: { cs: CaseStudy }) {
  return (
    <>
      {cs.next && (
        <div className="px-5 md:px-8 pb-5">
          <Link
            href={`/work/${cs.next.slug}`}
            className={`${cs.gradientClass} group block rounded-xl p-7 md:p-8 text-[var(--color-cream)] relative overflow-hidden hover:scale-[1.006] transition-transform duration-300`}
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/[0.06] blur-3xl pointer-events-none" />
            <div className="relative flex justify-between items-end">
              <div>
                <div className="font-mono text-[9px] text-white/50 uppercase tracking-widest mb-3">
                  {cs.next.numberLabel}
                </div>
                <div className="serif-display text-[26px] md:text-[30px] leading-[1.05]">
                  {cs.next.client}
                </div>
              </div>
              <div className="text-[20px] opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                →
              </div>
            </div>
          </Link>
        </div>
      )}
      <div className="px-5 md:px-8 pb-9">
        <div className="bg-white border border-black/10 rounded-[10px] p-5 md:p-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <div className="serif-display text-[18px] md:text-[20px] mb-1">
              Got an inbox that should be a dashboard?
            </div>
            <div className="text-[13px] text-[var(--color-muted)]">
              30-min audit call. Free. No deck.
            </div>
          </div>
          <ButtonPrimary href={siteConfig.calLink} external className="w-full md:w-auto py-3.5 md:py-2.5">
            Book a call →
          </ButtonPrimary>
        </div>
      </div>
    </>
  );
}
