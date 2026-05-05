"use client";

const NW = 114;
const NH = 42;

const NODES = [
  { id: "hubspot", label: "HubSpot",   sub: "CRM · Source",  x: 180, y: 55,  c: "#FF7A59" },
  { id: "clay",    label: "Clay",       sub: "Enrich",         x: 180, y: 148, c: "#7B6FFF" },
  { id: "n8n",     label: "n8n",        sub: "Orchestrate",    x: 180, y: 242, c: "#F55F44" },
  { id: "claude",  label: "Claude API", sub: "Personalize",    x: 82,  y: 335, c: "#A08DF5" },
  { id: "apollo",  label: "Apollo",     sub: "Target",         x: 278, y: 335, c: "#1C97F4" },
  { id: "send",    label: "Instantly",  sub: "Send",           x: 180, y: 425, c: "#34D399" },
];

// Edges: from bottom of source node to top of dest node
// Node top = y - 21, node bottom = y + 21
const EDGES = [
  { id: "e1", d: "M180,76 L180,127",           dur: 0.75, n: 2 },
  { id: "e2", d: "M180,169 L180,221",          dur: 0.75, n: 2 },
  { id: "e3", d: "M180,263 Q128,292 82,314",   dur: 1.4,  n: 2 },
  { id: "e4", d: "M180,263 Q232,292 278,314",  dur: 1.4,  n: 2 },
  { id: "e5", d: "M82,356 Q128,386 180,404",   dur: 1.3,  n: 2 },
  { id: "e6", d: "M278,356 Q232,386 180,404",  dur: 1.3,  n: 2 },
];

export function GtmFlow() {
  return (
    <svg
      viewBox="0 0 360 480"
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="gf-dots" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="0" cy="0" r="0.65" fill="rgba(255,255,255,0.06)" />
        </pattern>
        <style>{`
          .gf-label { font: 500 10.5px ui-monospace,"SF Mono",Menlo,monospace; fill: rgba(255,255,255,.86); }
          .gf-sub   { font:     8.5px ui-monospace,"SF Mono",Menlo,monospace; fill: rgba(255,255,255,.34); }
        `}</style>
        {EDGES.map((e) => (
          <path key={e.id} id={`${e.id}p`} d={e.d} />
        ))}
      </defs>

      {/* Background */}
      <rect width="360" height="480" fill="#06101e" />
      <rect width="360" height="480" fill="url(#gf-dots)" />

      {/* Edge lines */}
      {EDGES.map((e) => (
        <path
          key={e.id}
          d={e.d}
          stroke="rgba(255,255,255,.11)"
          strokeWidth="1"
          fill="none"
        />
      ))}

      {/* Pulse dots — two per edge, offset by half duration for even spacing */}
      {EDGES.flatMap((e) =>
        Array.from({ length: e.n }, (_, i) => (
          <circle key={`${e.id}-${i}`} r="2.5" fill="#A08DF5" opacity=".9">
            <animateMotion
              dur={`${e.dur}s`}
              begin={`${(-e.dur * i / e.n).toFixed(3)}s`}
              repeatCount="indefinite"
            >
              <mpath href={`#${e.id}p`} />
            </animateMotion>
          </circle>
        ))
      )}

      {/* Nodes */}
      {NODES.map((n) => (
        <g key={n.id}>
          <rect
            x={n.x - 57} y={n.y - 21}
            width={NW} height={NH} rx="7"
            fill="#0c1624"
            stroke={n.c} strokeWidth="1" strokeOpacity=".45"
          />
          <circle cx={n.x - 44} cy={n.y} r="3.5" fill={n.c} opacity=".9" />
          <text x={n.x - 30} y={n.y - 3} className="gf-label">{n.label}</text>
          <text x={n.x - 30} y={n.y + 10} className="gf-sub">{n.sub}</text>
        </g>
      ))}
    </svg>
  );
}
