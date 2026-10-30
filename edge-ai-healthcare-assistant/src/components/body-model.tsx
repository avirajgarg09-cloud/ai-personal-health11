"use client";

import Image from "next/image";
import { useState } from "react";

type Hotspot = {
  id: string;
  label: string;
  value: string;
  top: string;
  left: string;
  status: "good" | "watch";
};

const HOTSPOTS: Hotspot[] = [
  { id: "brain", label: "Mental Alertness", value: "Stable", top: "8%", left: "50%", status: "good" },
  { id: "heart", label: "Heart Rate", value: "76 bpm", top: "33%", left: "40%", status: "good" },
  { id: "lungs", label: "SpO₂", value: "98%", top: "30%", left: "63%", status: "good" },
  { id: "liver", label: "Blood Sugar", value: "108 mg/dL", top: "48%", left: "62%", status: "watch" },
  { id: "bp", label: "Blood Pressure", value: "122/80", top: "58%", left: "28%", status: "good" },
  { id: "legs", label: "Mobility", value: "Active today", top: "82%", left: "55%", status: "good" },
];

export function BodyModel() {
  const [active, setActive] = useState<string>("heart");
  const activeHotspot = HOTSPOTS.find((h) => h.id === active) ?? HOTSPOTS[0];

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-3xl glass-panel-dark p-6">
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,rgba(74,222,128,0.35)_1px,transparent_0)] [background-size:22px_22px]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-full w-[1px] -translate-x-1/2 bg-gradient-to-b from-transparent via-emerald-400/0 to-transparent" />

      <p className="relative z-10 mb-2 flex items-center gap-2 self-start text-xs font-semibold uppercase tracking-widest text-emerald-300">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        Live Body Scan
      </p>

      <div className="relative z-10 mx-auto aspect-[3/4] w-full max-w-[260px] animate-float-slow">
        <div className="pointer-events-none absolute left-0 top-0 h-[2px] w-full animate-scan-line rounded-full bg-gradient-to-r from-transparent via-emerald-300/90 to-transparent shadow-[0_0_14px_3px_rgba(74,222,128,0.6)]" />
        <Image
          src="/images/body-scan.png"
          alt="Human body holographic scan"
          fill
          sizes="260px"
          className="object-contain drop-shadow-[0_0_30px_rgba(74,222,128,0.35)]"
          priority
        />

        {HOTSPOTS.map((h) => (
          <button
            key={h.id}
            onClick={() => setActive(h.id)}
            style={{ top: h.top, left: h.left }}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
          >
            <span
              className={`absolute inset-0 -m-2 rounded-full ${
                h.status === "good" ? "bg-emerald-400/40" : "bg-amber-300/40"
              } ${active === h.id ? "animate-pulse-ring" : ""}`}
            />
            <span
              className={`relative block h-2.5 w-2.5 rounded-full ring-2 ring-white/70 transition-transform group-hover:scale-125 ${
                h.status === "good" ? "bg-emerald-400" : "bg-amber-300"
              } ${active === h.id ? "scale-125" : ""}`}
            />
          </button>
        ))}
      </div>

      <div className="relative z-10 mt-5 w-full rounded-2xl border border-emerald-400/20 bg-emerald-950/40 px-4 py-3 text-center">
        <p className="text-[11px] uppercase tracking-wide text-emerald-300/80">{activeHotspot.label}</p>
        <p className="text-xl font-bold text-white">{activeHotspot.value}</p>
      </div>

      <div className="relative z-10 mt-4 grid w-full grid-cols-3 gap-2">
        {HOTSPOTS.map((h) => (
          <button
            key={h.id}
            onClick={() => setActive(h.id)}
            className={`truncate rounded-lg border px-2 py-1.5 text-[10px] font-medium transition ${
              active === h.id
                ? "border-emerald-400 bg-emerald-400/10 text-emerald-200"
                : "border-white/10 text-emerald-100/60 hover:border-emerald-400/40"
            }`}
          >
            {h.label}
          </button>
        ))}
      </div>
    </div>
  );
}
