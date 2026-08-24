"use client";

import dynamic from "next/dynamic";

// three.js touches window and WebGL on mount, so this never renders on the server
const EnterThePitch = dynamic(() => import("./EnterThePitch"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh] bg-[#0A0D0A]">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#C9A227]">
        Loading the pitch…
      </span>
    </div>
  ),
});

export function PitchClient() {
  return <EnterThePitch />;
}
