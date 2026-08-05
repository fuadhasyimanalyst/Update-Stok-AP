"use client";

export default function DepoHealthBars({ depoStats, onDepoClick, activeDepo }) {
  if (!depoStats.length) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-5 py-6 text-sm text-[var(--muted)]">
        Tidak ada data untuk filter saat ini.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-[family-name:var(--font-display)] text-sm uppercase tracking-wider text-[var(--ink)]">
          Kesehatan Stok per Depo
        </h2>
        <div className="flex items-center gap-3 text-[11px] text-[var(--muted)]">
          <LegendDot color="var(--fast)" label="Fast" />
          <LegendDot color="var(--slow)" label="Slow" />
          <LegendDot color="var(--dead)" label="Dead" />
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {depoStats.map((d) => {
          const total = d.fast + d.slow + d.dead + d.unknown || 1;
          const isActive = activeDepo === d.depo;
          return (
            <button
              key={d.depo}
              onClick={() => onDepoClick(isActive ? "" : d.depo)}
              className={`group flex items-center gap-3 w-full text-left rounded-md px-2 py-1.5 transition-colors ${
                isActive ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--bg)]"
              }`}
            >
              <span className="w-28 shrink-0 text-xs font-semibold text-[var(--text)] truncate">
                {d.depo}
              </span>
              <span className="flex-1 h-3 rounded-full overflow-hidden flex bg-[#eceeea]">
                <span
                  style={{ width: `${(d.fast / total) * 100}%`, backgroundColor: "var(--fast)" }}
                  title={`Fast Moving: ${d.fast}`}
                />
                <span
                  style={{ width: `${(d.slow / total) * 100}%`, backgroundColor: "var(--slow)" }}
                  title={`Slow Moving: ${d.slow}`}
                />
                <span
                  style={{ width: `${(d.dead / total) * 100}%`, backgroundColor: "var(--dead)" }}
                  title={`Dead Stock: ${d.dead}`}
                />
                <span
                  style={{ width: `${(d.unknown / total) * 100}%`, backgroundColor: "#c9cdc3" }}
                  title={`Belum Dikategorikan: ${d.unknown}`}
                />
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
