import { NextRequest, NextResponse } from "next/server";
import { promises as dns } from "dns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckResult = {
  domain: string;
  score: number;
  band: "good" | "mid" | "bad";
  checks: {
    spf: { present: boolean; value: string | null; notes: string };
    dkim: { present: boolean; selectors: string[]; notes: string };
    dmarc: { present: boolean; value: string | null; policy: string | null; notes: string };
    mx: { present: boolean; records: string[]; notes: string };
  };
};

const COMMON_DKIM_SELECTORS = [
  "default",
  "google",
  "selector1",
  "selector2",
  "k1",
  "k2",
  "mail",
  "smtp",
  "dkim",
];

async function resolveTxt(name: string): Promise<string[]> {
  try {
    const records = await dns.resolveTxt(name);
    return records.map((r) => r.join(""));
  } catch {
    return [];
  }
}

async function resolveMx(name: string): Promise<string[]> {
  try {
    const records = await dns.resolveMx(name);
    return records.map((r) => `${r.priority} ${r.exchange}`);
  } catch {
    return [];
  }
}

function sanitizeDomain(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  // Strip protocol and path
  const cleaned = trimmed
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
  // Basic domain validation
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

function bandFromScore(score: number): "good" | "mid" | "bad" {
  if (score >= 80) return "good";
  if (score >= 70) return "mid";
  return "bad";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const domain = sanitizeDomain(body.domain || "");
    if (!domain) {
      return NextResponse.json(
        { error: "Invalid domain. Use a format like example.com" },
        { status: 400 }
      );
    }

    // Run all DNS lookups in parallel
    const [rootTxt, dmarcTxt, mxRecords, ...dkimResults] = await Promise.all([
      resolveTxt(domain),
      resolveTxt(`_dmarc.${domain}`),
      resolveMx(domain),
      ...COMMON_DKIM_SELECTORS.map((s) => resolveTxt(`${s}._domainkey.${domain}`)),
    ]);

    // SPF
    const spfRecord = rootTxt.find((r) => r.toLowerCase().startsWith("v=spf1"));
    const spfPresent = !!spfRecord;
    let spfNotes = "Missing — set SPF or your mail will be flagged.";
    if (spfPresent) {
      const includes = (spfRecord?.match(/include:[\w.-]+/g) || []).length;
      const hasAll = /[~\-+]all/.test(spfRecord || "");
      if (!hasAll) {
        spfNotes = "Present but missing -all or ~all. Recipients won't enforce policy.";
      } else if (includes > 8) {
        spfNotes = "Watch for the 10 DNS-lookup limit. Consider flattening.";
      } else {
        spfNotes = "Healthy.";
      }
    }

    // DMARC
    const dmarcRecord = dmarcTxt.find((r) => r.toLowerCase().startsWith("v=dmarc1"));
    const dmarcPresent = !!dmarcRecord;
    let dmarcPolicy: string | null = null;
    let dmarcNotes = "Missing — set DMARC to control how recipients handle spoofed mail.";
    if (dmarcPresent) {
      const policyMatch = dmarcRecord?.match(/p=(\w+)/i);
      dmarcPolicy = policyMatch ? policyMatch[1].toLowerCase() : null;
      if (dmarcPolicy === "reject") dmarcNotes = "Strong — p=reject in place.";
      else if (dmarcPolicy === "quarantine") dmarcNotes = "Solid — p=quarantine. Tighten to reject when ready.";
      else if (dmarcPolicy === "none") dmarcNotes = "Monitoring only. Move to quarantine or reject for real protection.";
      else dmarcNotes = "Present but no policy detected.";
    }

    // DKIM
    const foundSelectors: string[] = [];
    dkimResults.forEach((records, i) => {
      const hasDkim = records.some((r) => r.toLowerCase().includes("v=dkim1"));
      if (hasDkim) foundSelectors.push(COMMON_DKIM_SELECTORS[i]);
    });
    const dkimPresent = foundSelectors.length > 0;
    const dkimNotes = dkimPresent
      ? `Found on selector${foundSelectors.length > 1 ? "s" : ""}: ${foundSelectors.join(", ")}.`
      : "No DKIM found on common selectors. Outbound from this domain likely fails authentication.";

    // MX
    const mxPresent = mxRecords.length > 0;
    const mxNotes = mxPresent
      ? `${mxRecords.length} MX record${mxRecords.length > 1 ? "s" : ""} found.`
      : "No MX records — domain can't receive mail.";

    // Score: 25 each
    let score = 0;
    if (spfPresent) {
      score += spfNotes === "Healthy." ? 25 : 18;
    }
    if (dkimPresent) {
      score += foundSelectors.length >= 2 ? 25 : 20;
    }
    if (dmarcPresent) {
      if (dmarcPolicy === "reject") score += 25;
      else if (dmarcPolicy === "quarantine") score += 22;
      else if (dmarcPolicy === "none") score += 14;
      else score += 10;
    }
    if (mxPresent) score += 25;

    const result: CheckResult = {
      domain,
      score,
      band: bandFromScore(score),
      checks: {
        spf: { present: spfPresent, value: spfRecord || null, notes: spfNotes },
        dkim: { present: dkimPresent, selectors: foundSelectors, notes: dkimNotes },
        dmarc: {
          present: dmarcPresent,
          value: dmarcRecord || null,
          policy: dmarcPolicy,
          notes: dmarcNotes,
        },
        mx: { present: mxPresent, records: mxRecords, notes: mxNotes },
      },
    };

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: "Something went wrong running the check." },
      { status: 500 }
    );
  }
}
