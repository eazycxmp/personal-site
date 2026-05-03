import { NextRequest, NextResponse } from "next/server";
import { promises as dns } from "dns";

type CheckResult = {
  status: "pass" | "fail" | "warn";
  label: string;
  detail: string;
};

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function isValidDomain(domain: string): boolean {
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(
    domain
  );
}

async function checkMx(domain: string): Promise<CheckResult> {
  try {
    const records = await dns.resolveMx(domain);
    if (!records || records.length === 0) {
      return { status: "fail", label: "MX record", detail: "No MX records found" };
    }
    return {
      status: "pass",
      label: "MX record",
      detail: `${records.length} MX record${records.length > 1 ? "s" : ""}: ${records
        .map((r) => r.exchange)
        .join(", ")}`,
    };
  } catch {
    return { status: "fail", label: "MX record", detail: "DNS lookup failed" };
  }
}

async function checkSpf(domain: string): Promise<CheckResult> {
  try {
    const records = await dns.resolveTxt(domain);
    const flat = records.map((r) => r.join(""));
    const spf = flat.find((r) => r.toLowerCase().startsWith("v=spf1"));
    if (!spf) {
      return { status: "fail", label: "SPF record", detail: "No SPF record found" };
    }
    if (spf.includes("+all")) {
      return {
        status: "fail",
        label: "SPF record",
        detail: `Found but uses +all (insecure): ${spf}`,
      };
    }
    if (!spf.match(/[~-]all\b/)) {
      return {
        status: "warn",
        label: "SPF record",
        detail: `Found but missing terminating ~all or -all: ${spf}`,
      };
    }
    return { status: "pass", label: "SPF record", detail: spf };
  } catch {
    return { status: "fail", label: "SPF record", detail: "DNS lookup failed" };
  }
}

async function checkDmarc(domain: string): Promise<CheckResult> {
  try {
    const records = await dns.resolveTxt(`_dmarc.${domain}`);
    const flat = records.map((r) => r.join(""));
    const dmarc = flat.find((r) => r.toLowerCase().startsWith("v=dmarc1"));
    if (!dmarc) {
      return { status: "fail", label: "DMARC record", detail: "No DMARC record found" };
    }
    const policy = dmarc.match(/p=(\w+)/i)?.[1]?.toLowerCase();
    if (policy === "none") {
      return {
        status: "warn",
        label: "DMARC record",
        detail: `Found, but policy is "none" (monitoring only): ${dmarc}`,
      };
    }
    if (policy === "quarantine" || policy === "reject") {
      return {
        status: "pass",
        label: "DMARC record",
        detail: `Policy: ${policy}. ${dmarc}`,
      };
    }
    return {
      status: "warn",
      label: "DMARC record",
      detail: `Found but policy unclear: ${dmarc}`,
    };
  } catch {
    return {
      status: "fail",
      label: "DMARC record",
      detail: `No DMARC record at _dmarc.${domain}`,
    };
  }
}

async function checkDkim(domain: string): Promise<CheckResult> {
  const selectors = [
    "default",
    "google",
    "selector1",
    "selector2",
    "k1",
    "k2",
    "mandrill",
    "mailgun",
    "sendgrid",
    "cf2024-1",
    "s1",
    "s2",
  ];

  const results = await Promise.allSettled(
    selectors.map((s) => dns.resolveTxt(`${s}._domainkey.${domain}`))
  );

  const found = results
    .map((r, i) => ({ result: r, selector: selectors[i] }))
    .filter((x) => x.result.status === "fulfilled");

  if (found.length === 0) {
    return {
      status: "warn",
      label: "DKIM record",
      detail: `No DKIM record at common selectors. (DKIM uses provider-specific selectors and may be configured under one we didn't try.)`,
    };
  }

  const selectorList = found.map((f) => f.selector).join(", ");
  return {
    status: "pass",
    label: "DKIM record",
    detail: `DKIM key found at selector(s): ${selectorList}`,
  };
}

function calculateScore(results: CheckResult[]): number {
  const weights: Record<string, number> = {
    "MX record": 20,
    "SPF record": 30,
    "DMARC record": 30,
    "DKIM record": 20,
  };
  let score = 0;
  for (const r of results) {
    const w = weights[r.label] ?? 0;
    if (r.status === "pass") score += w;
    else if (r.status === "warn") score += Math.floor(w * 0.5);
  }
  return score;
}

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in a minute." },
      { status: 429 }
    );
  }

  const domain = request.nextUrl.searchParams.get("domain")?.trim().toLowerCase();
  if (!domain) {
    return NextResponse.json({ error: "Missing domain parameter" }, { status: 400 });
  }
  if (!isValidDomain(domain)) {
    return NextResponse.json({ error: "Invalid domain format" }, { status: 400 });
  }

  const [mx, spf, dmarc, dkim] = await Promise.all([
    checkMx(domain),
    checkSpf(domain),
    checkDmarc(domain),
    checkDkim(domain),
  ]);

  const results = [mx, spf, dmarc, dkim];
  const score = calculateScore(results);

  return NextResponse.json({ domain, results, score });
}
