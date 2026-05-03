import { NextResponse } from "next/server";
import { promises as dns } from "dns";

type CheckStatus = "pass" | "warn" | "fail";
type CheckResult = { status: CheckStatus; label: string; detail: string; weight: number };

const ipBuckets = new Map<string, { count: number; reset: number }>();
function rateLimit(ip: string, max = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = ipBuckets.get(ip);
  if (!bucket || now > bucket.reset) {
    ipBuckets.set(ip, { count: 1, reset: now + windowMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count++;
  return true;
}

async function checkMX(domain: string): Promise<CheckResult> {
  try {
    const records = await dns.resolveMx(domain);
    if (!records.length) {
      return { status: "fail", label: "MX records", detail: "No MX records found. Domain cannot receive email.", weight: 15 };
    }
    const sorted = records.sort((a, b) => a.priority - b.priority);
    return { status: "pass", label: "MX records", detail: `${records.length} MX record(s). Primary: ${sorted[0].exchange} (priority ${sorted[0].priority})`, weight: 15 };
  } catch {
    return { status: "fail", label: "MX records", detail: "MX lookup failed. Domain cannot receive email.", weight: 15 };
  }
}

async function checkSPF(domain: string): Promise<CheckResult> {
  try {
    const records = await dns.resolveTxt(domain);
    const spfRecords = records.filter((r) => r.join("").toLowerCase().startsWith("v=spf1"));
    if (spfRecords.length === 0) {
      return { status: "fail", label: "SPF record", detail: "No SPF record found. Spoofing protection missing.", weight: 20 };
    }
    if (spfRecords.length > 1) {
      return { status: "fail", label: "SPF record", detail: `Multiple SPF records found (${spfRecords.length}). RFC violation. Pick one.`, weight: 20 };
    }
    const spf = spfRecords[0].join("");
    if (spf.includes("+all")) {
      return { status: "fail", label: "SPF record", detail: "SPF ends in +all. Allows anyone to spoof. Critical.", weight: 20 };
    }
    if (spf.includes("?all")) {
      return { status: "warn", label: "SPF record", detail: "SPF ends in ?all (neutral). Receivers will not enforce. Use ~all or -all.", weight: 20 };
    }
    if (spf.includes("~all")) {
      return { status: "pass", label: "SPF record", detail: `SPF present, soft-fail (~all). ${spf.length > 80 ? spf.slice(0, 80) + "…" : spf}`, weight: 20 };
    }
    if (spf.includes("-all")) {
      return { status: "pass", label: "SPF record", detail: `SPF present, hard-fail (-all). Strict. ${spf.length > 80 ? spf.slice(0, 80) + "…" : spf}`, weight: 20 };
    }
    return { status: "warn", label: "SPF record", detail: "SPF found but no clear all-mechanism. Add ~all or -all.", weight: 20 };
  } catch {
    return { status: "fail", label: "SPF record", detail: "TXT lookup failed.", weight: 20 };
  }
}

async function checkDMARC(domain: string): Promise<CheckResult> {
  try {
    const records = await dns.resolveTxt(`_dmarc.${domain}`);
    const dmarcRecords = records.filter((r) => r.join("").toLowerCase().startsWith("v=dmarc1"));
    if (dmarcRecords.length === 0) {
      return { status: "fail", label: "DMARC record", detail: "No DMARC record. Spoofers free to impersonate.", weight: 25 };
    }
    const dmarc = dmarcRecords[0].join("");
    const policyMatch = dmarc.match(/p=(none|quarantine|reject)/i);
    const policy = policyMatch?.[1]?.toLowerCase();
    const pctMatch = dmarc.match(/pct=(\d+)/i);
    const pct = pctMatch ? parseInt(pctMatch[1], 10) : 100;
    const hasReporting = /rua=/i.test(dmarc);

    if (!policy) {
      return { status: "warn", label: "DMARC record", detail: "DMARC found but no policy specified.", weight: 25 };
    }
    if (policy === "none") {
      const detail = hasReporting
        ? "DMARC policy is 'none' (monitoring only). Move to quarantine or reject for protection."
        : "DMARC policy is 'none' AND no rua reporting. Effectively no DMARC enforcement.";
      return { status: "warn", label: "DMARC record", detail, weight: 25 };
    }
    if (policy === "quarantine" && pct < 100) {
      return { status: "warn", label: "DMARC record", detail: `DMARC quarantine at ${pct}% rollout. Increase to 100% then move to reject.`, weight: 25 };
    }
    if (policy === "quarantine") {
      return { status: "pass", label: "DMARC record", detail: "DMARC quarantine 100%. Strong but not maximum. Consider reject.", weight: 25 };
    }
    if (policy === "reject") {
      return { status: "pass", label: "DMARC record", detail: `DMARC reject 100%. Maximum protection.`, weight: 25 };
    }
    return { status: "warn", label: "DMARC record", detail: `DMARC policy unclear: ${policy}`, weight: 25 };
  } catch {
    return { status: "fail", label: "DMARC record", detail: "No _dmarc TXT record. Domain unprotected from spoofing.", weight: 25 };
  }
}

async function checkDKIM(domain: string): Promise<CheckResult> {
  const selectors = [
    "google",
    "default",
    "selector1",
    "selector2",
    "k1",
    "k2",
    "mailo",
    "mandrill",
    "smtpapi",
    "mail",
    "dkim",
    "s1",
    "s2",
    "cf2024-1",
    "cf2024-2",
    "fm1",
    "fm2",
    "fm3",
  ];
  const found: string[] = [];
  await Promise.all(
    selectors.map(async (selector) => {
      try {
        const records = await dns.resolveTxt(`${selector}._domainkey.${domain}`);
        const dkim = records.find((r) => r.join("").toLowerCase().includes("v=dkim1") || r.join("").toLowerCase().includes("p="));
        if (dkim) found.push(selector);
      } catch {
        // selector miss is expected
      }
    })
  );
  if (found.length === 0) {
    return { status: "warn", label: "DKIM record", detail: "No DKIM keys found at common selectors. Either DKIM not set up, or your selector is custom.", weight: 20 };
  }
  return { status: "pass", label: "DKIM record", detail: `DKIM key(s) found at: ${found.join(", ")}`, weight: 20 };
}

async function checkMTA_STS(domain: string): Promise<CheckResult> {
  try {
    const records = await dns.resolveTxt(`_mta-sts.${domain}`);
    const stsRecord = records.find((r) => r.join("").toLowerCase().startsWith("v=stsv1"));
    if (stsRecord) {
      return { status: "pass", label: "MTA-STS", detail: "MTA-STS configured. Enforces TLS for inbound SMTP.", weight: 10 };
    }
    return { status: "warn", label: "MTA-STS", detail: "No MTA-STS. Inbound SMTP not strictly TLS-enforced.", weight: 10 };
  } catch {
    return { status: "warn", label: "MTA-STS", detail: "No MTA-STS record. Optional but recommended for inbox sender reputation.", weight: 10 };
  }
}

async function checkBIMI(domain: string): Promise<CheckResult> {
  try {
    const records = await dns.resolveTxt(`default._bimi.${domain}`);
    const bimi = records.find((r) => r.join("").toLowerCase().startsWith("v=bimi1"));
    if (bimi) {
      return { status: "pass", label: "BIMI logo", detail: "BIMI configured. Logo shown in supported clients (Gmail, Apple Mail).", weight: 10 };
    }
    return { status: "warn", label: "BIMI logo", detail: "No BIMI record. Brand logo will not show in inbox.", weight: 10 };
  } catch {
    return { status: "warn", label: "BIMI logo", detail: "No BIMI configured. Brand logo missing from supported inboxes.", weight: 10 };
  }
}

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "anon";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit. Try again in a minute." }, { status: 429 });
  }

  const url = new URL(request.url);
  const domain = url.searchParams.get("domain")?.trim().toLowerCase();
  if (!domain) {
    return NextResponse.json({ error: "Missing domain parameter." }, { status: 400 });
  }
  const cleaned = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(cleaned)) {
    return NextResponse.json({ error: "Invalid domain format." }, { status: 400 });
  }

  const results = await Promise.all([
    checkMX(cleaned),
    checkSPF(cleaned),
    checkDMARC(cleaned),
    checkDKIM(cleaned),
    checkMTA_STS(cleaned),
    checkBIMI(cleaned),
  ]);

  const totalWeight = results.reduce((sum, r) => sum + r.weight, 0);
  const earned = results.reduce((sum, r) => {
    if (r.status === "pass") return sum + r.weight;
    if (r.status === "warn") return sum + r.weight * 0.4;
    return sum;
  }, 0);
  const score = Math.round((earned / totalWeight) * 100);

  return NextResponse.json({
    domain: cleaned,
    results: results.map(({ status, label, detail }) => ({ status, label, detail })),
    score,
  });
}