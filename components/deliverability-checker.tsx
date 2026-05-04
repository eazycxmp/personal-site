"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

// A short rotating list of "recent checks" for visual interest. Real product would persist these.
const SAMPLE_RECENT = [
  { domain: "stripe.com", score: 88 },
  { domain: "github.com", score: 75 },
  { domain: "vercel.com", score: 72 },
  { domain: "shopify.com", score: 62 },
];

function scoreClass(score: number): string {
  if (score >= 80) return "score-good";
  if (score >= 70) return "score-mid";
  return "score-bad";
}

export function DeliverabilityChecker() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  async function runCheck(e?: React.FormEvent) {
    e?.preventDefault();
    if (!domain.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setExpanded(false);
    try {
      const res = await fetch("/api/check-deliverability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Check failed.");
      } else {
        setResult(data);
        setExpanded(true);
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-black/10 rounded-lg p-3.5 sm:p-4">
      <form onSubmit={runCheck} className="flex flex-col sm:flex-row gap-2 mb-3.5">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="yourdomain.com"
          className="flex-1 bg-[var(--color-cream)] rounded-md px-3 py-2.5 font-mono text-[13px] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-violet)]/30"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={loading || !domain.trim()}
          className="bg-[var(--color-ink)] text-[var(--color-cream)] px-[18px] py-2.5 rounded-md text-[12px] font-medium disabled:opacity-60 disabled:cursor-not-allowed hover:bg-black transition-colors"
        >
          {loading ? "Checking…" : "Run check"}
        </button>
      </form>

      {error && (
        <div className="text-[12px] text-[var(--color-bad)] mb-3 font-mono">{error}</div>
      )}

      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
          >
            {/* Score bar */}
            <div className="flex items-baseline justify-between border-t border-black/5 pt-3">
              <div className="font-mono text-[12px] text-[var(--color-ink)]">
                {result.domain}
              </div>
              <div className={`font-mono text-[18px] font-medium ${scoreClass(result.score)}`}>
                {result.score}/100
              </div>
            </div>

            {/* Expandable detail */}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-[11px] text-[var(--color-accent)] mt-2 font-medium hover:underline"
            >
              {expanded ? "Hide details ↑" : "Show details ↓"}
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                    <CheckRow label="SPF" present={result.checks.spf.present} note={result.checks.spf.notes} />
                    <CheckRow label="DKIM" present={result.checks.dkim.present} note={result.checks.dkim.notes} />
                    <CheckRow label="DMARC" present={result.checks.dmarc.present} note={result.checks.dmarc.notes} />
                    <CheckRow label="MX" present={result.checks.mx.present} note={result.checks.mx.notes} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="recent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="font-mono text-[10px] text-[var(--color-mute-2)] tracking-wider mb-2">
              SAMPLE CHECKS
            </div>
            <div className="font-mono text-[12px]">
              {SAMPLE_RECENT.map((r) => (
                <div key={r.domain} className="flex justify-between py-[3px]">
                  <span>{r.domain}</span>
                  <span className={scoreClass(r.score)}>{r.score}/100</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckRow({
  label,
  present,
  note,
}: {
  label: string;
  present: boolean;
  note: string;
}) {
  return (
    <div className="border border-black/5 rounded-md p-3">
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${
            present ? "bg-[var(--color-good)]" : "bg-[var(--color-bad)]"
          }`}
        />
        <span className="font-mono text-[10px] tracking-wider text-[var(--color-muted)]">
          {label}
        </span>
      </div>
      <div className="text-[11px] text-[var(--color-ink-soft)] leading-snug">{note}</div>
    </div>
  );
}
