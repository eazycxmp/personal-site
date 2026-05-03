"use client";

import { useState, useEffect } from "react";
import { Check, X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type CheckResult = {
  status: "pass" | "fail" | "warn";
  label: string;
  detail: string;
};

type ApiResponse = {
  domain: string;
  results: CheckResult[];
  score: number;
};

const RECENT_EXAMPLES = [
  { domain: "stripe.com", score: 100 },
  { domain: "github.com", score: 100 },
  { domain: "vercel.com", score: 95 },
  { domain: "espencampbell.com", score: 80 },
];

export function DeliverabilityCheck() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!domain.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const cleaned = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      const res = await fetch(`/api/deliverability?domain=${encodeURIComponent(cleaned)}`);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errBody.error || `Request failed (${res.status})`);
      }
      const json: ApiResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
      <form onSubmit={handleCheck} className="flex border-b border-[var(--color-border)]">
        <div className="flex-1 relative">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="yourdomain.com"
            className="w-full px-5 py-4 bg-transparent text-base font-mono outline-none placeholder:text-[var(--color-muted)]"
            autoComplete="off"
            spellCheck={false}
          />
          {!domain && !loading && (
            <span className="absolute left-[7.4rem] top-1/2 -translate-y-1/2 w-[2px] h-5 bg-[var(--color-fg)] animate-blink pointer-events-none" aria-hidden />
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !domain.trim()}
          className="px-6 bg-[var(--color-fg)] text-[var(--color-bg)] font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? "Checking" : "Run check"}
        </button>
      </form>

      <div className="p-5 min-h-[220px] relative">
        {!data && !error && !loading && (
          <div>
            <p className="text-sm text-[var(--color-muted)] font-mono mb-4">$ Try your own domain or any domain you are curious about.</p>
            <RecentlyChecked />
          </div>
        )}

        {loading && <ScanLineLoader domain={domain} />}

        {error && <div className="text-sm text-[var(--color-danger)] font-mono">$ Error: {error}</div>}

        {data && (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between mb-4">
              <p className="font-mono text-sm">
                <span className="text-[var(--color-muted)]">$ check </span>
                <span className="text-[var(--color-fg)]">{data.domain}</span>
              </p>
              <p className="text-sm">
                Score: <CountUpScore value={data.score} />/100
              </p>
            </div>
            {data.results.map((r, i) => (
              <ResultRow key={`${data.domain}-${i}`} result={r} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RecentlyChecked() {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-[var(--color-muted)] font-mono uppercase tracking-wide mb-2">Recent checks</p>
      {RECENT_EXAMPLES.map((ex, i) => (
        <motion.div
          key={ex.domain}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-between text-sm font-mono"
        >
          <span className="text-[var(--color-muted)]">{ex.domain}</span>
          <span className={ex.score >= 90 ? "text-[var(--color-success)]" : ex.score >= 70 ? "text-[var(--color-warning)]" : "text-[var(--color-danger)]"}>
            {ex.score}/100
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function ScanLineLoader({ domain }: { domain: string }) {
  return (
    <div className="relative">
      <p className="text-sm text-[var(--color-muted)] font-mono">$ Looking up DNS records for {domain}...</p>
      <motion.div
        initial={{ y: 0, opacity: 0 }}
        animate={{ y: 80, opacity: [0, 1, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-px bg-[var(--color-fg)] pointer-events-none"
        style={{ top: 0 }}
      />
    </div>
  );
}

function CountUpScore({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 600;
    const start = performance.now();
    const startVal = 0;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(startVal + (value - startVal) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span className="font-mono font-semibold tabular-nums">{display}</span>;
}

function ResultRow({ result, index }: { result: CheckResult; index: number }) {
  const Icon = result.status === "pass" ? Check : result.status === "fail" ? X : AlertTriangle;
  const color = result.status === "pass" ? "var(--color-success)" : result.status === "fail" ? "var(--color-danger)" : "var(--color-warning)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-3 py-2 border-b border-[var(--color-border)] last:border-0"
    >
      <Icon size={16} style={{ color }} className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{result.label}</p>
        <p className="text-xs text-[var(--color-muted)] font-mono mt-0.5 break-all">{result.detail}</p>
      </div>
    </motion.div>
  );
}
