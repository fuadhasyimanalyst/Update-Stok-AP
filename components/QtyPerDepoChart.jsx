"use client";

function formatQty(n) {
  return new Intl.NumberFormat("id-ID").format(n);
}

export default function QtyPerDepoChart({ data, onDepoClick, activeDepo }) {
  if (!data.length) {
    return (
      <div className="card px-5 py-6 text-sm text-[var(--muted)]">
        Tidak ada data untuk filter saat ini.
      </div>
    );
  }

  const maxQty = Math.max(...data.map((d) => d.qty), 1);
  const grandTotal = data.reduce((sum, d) => sum + d.qty, 0);

  return (
    <div className="card px-5 py-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
            Distribusi Qty Stok per Depo
          </h2>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">
            Perbandingan total unit stok di setiap depo
          </p>
        </div>
        <span className="text-[11px] font-semibold text-[var(--blue)] tabular">
          Total: {formatQty(grandTotal)} unit
        </span>
      </div>

      <div className="flex items-end gap-3 sm:gap-5 h-48 px-1">
        {data.map((d) => {
          const heightPct = Math.max((d.qty / maxQty) * 100, 2);
          const isActive = activeDepo === d.depo;
          return (
            <button
              key={d.depo}
              onClick={() => onDepoClick(isActive ? "" : d.depo)}
              className="group flex-1 min-w-0 flex flex-col items-center justify-end h-full gap-1.5"
              title={`${d.depo}: ${formatQty(d.qty)}`}
            >
              <span
                className={`text-[10px] sm:text-[11px] font-semibold tabular whitespace-nowrap transition-colors ${
                  isActive ? "text-[var(--blue)]" : "text-[var(--muted)] group-hover:text-[var(--blue)]"
                }`}
              >
                {formatQty(d.qty)}
              </span>
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: isActive ? "var(--blue)" : "var(--blue-100)",
                    border: `1.5px solid ${isActive ? "var(--blue)" : "var(--blue-100)"}`,
                  }}
                />
              </div>
              <span
                className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wide truncate w-full text-center transition-colors ${
                  isActive ? "text-[var(--blue)]" : "text-[var(--text)] group-hover:text-[var(--blue)]"
                }`}
              >
                {d.depo}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
