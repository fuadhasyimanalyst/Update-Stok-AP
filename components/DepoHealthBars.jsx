"use client";

import { useRef } from "react";
import ChartExportButtons from "./ChartExportButtons";

function Segment({ pct, count, color, textColor, title }) {
  if (pct <= 0) return null;
  const showLabel = pct >= 8;
  return (
    <span
      className="relative flex items-center justify-center h-full"
      style={{ width: `${pct}%`, backgroundColor: color }}
      title={`${title}: ${count} (${pct.toFixed(1)}%)`}
    >
      {showLabel && (
        <span
          className="text-[10px] font-bold leading-none tabular whitespace-nowrap"
          style={{ color: textColor }}
        >
          {Math.round(pct)}%
        </span>
      )}
    </span>
  );
}

export default function DepoHealthBars({ depoStats, onDepoClick, activeDepo }) {
  const captureRef = useRef(null);

  if (!depoStats.length) {
    return (
      <div className="card px-5 py-6 text-sm text-[var(--muted)]">
        Tidak ada data untuk filter saat ini.
      </div>
    );
  }

  return (
    <div ref={captureRef} className="card px-5 py-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
          Kesehatan Stok per Depo
        </h2>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 text-[11px] text-[var(--muted)] flex-wrap">
            <LegendDot color="var(--fast)" label="Fast" />
            <LegendDot color="var(--slow)" label="Slow" />
            <LegendDot color="var(--dead)" label="Dead" />
          </div>
          <ChartExportButtons targetRef={captureRef} filename="grafik-kesehatan-stok-per-depo" />
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {depoStats.map((d) => {
          const total = d.fast + d.slow + d.dead || 1;
          const isActive = activeDepo === d.depo;
          const fastPct = (d.fast / total) * 100;
          const slowPct = (d.slow / total) * 100;
          const deadPct = (d.dead / total) * 100;
          return (
            <button
              key={d.depo}
              onClick={() => onDepoClick(isActive ? "" : d.depo)}
              className={`group flex items-center gap-3 w-full text-left rounded-md px-2 py-1.5 transition-colors ${
                isActive ? "bg-[var(--blue-soft)]" : "hover:bg-[var(--bg)]"
              }`}
            >
              <span className="w-28 shrink-0 text-xs font-semibold text-[var(--text)] truncate">
                {d.depo}
              </span>
              <span className="flex-1 h-5 rounded-full overflow-hidden flex bg-[var(--track-bg)]">
                <Segment pct={fastPct} count={d.fast} color="var(--fast)" textColor="#ffffff" title="Fast Moving" />
                <Segment pct={slowPct} count={d.slow} color="var(--slow)" textColor="#ffffff" title="Slow Moving" />
                <Segment pct={deadPct} count={d.dead} color="var(--dead)" textColor="#ffffff" title="Dead Stock" />
              </span>
              <span className="w-14 shrink-0 text-right text-xs tabular text-[var(--muted)]">
                {total} SKU
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
