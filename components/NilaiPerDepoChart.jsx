"use client";

import { useRef } from "react";
import ChartExportButtons from "./ChartExportButtons";

function formatRupiahSingkat(n) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `Rp${(n / 1_000_000_000).toFixed(1)}M`;
  if (abs >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(1)}jt`;
  if (abs >= 1_000) return `Rp${(n / 1_000).toFixed(0)}rb`;
  return `Rp${n}`;
}

function formatRupiahPenuh(n) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

/**
 * Bar chart nilai stok (QTY x HARGA_JUAL) per depo.
 * Harga jual di sini berasal dari DAFTAR_HARGA.xlsx (+ PPN 11%), BUKAN dari
 * NSTDPRICE di SaldoStock. Depo dengan bar tertinggi = nilai barang yang
 * tertahan paling besar di gudang itu -> kandidat utama "overstock".
 */
export default function NilaiPerDepoChart({ data, onDepoClick, activeDepo }) {
  const captureRef = useRef(null);

  if (!data.length) {
    return (
      <div className="card px-5 py-6 text-sm text-[var(--muted)]">
        Tidak ada data untuk filter saat ini.
      </div>
    );
  }

  const maxNilai = Math.max(...data.map((d) => d.nilai), 1);
  const grandTotal = data.reduce((sum, d) => sum + d.nilai, 0);
  const depoTertinggi = data[0];

  return (
    <div ref={captureRef} className="card px-5 py-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
            Nilai Stok per Depo (Qty × Harga Jual)
          </h2>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">
            Harga jual dari DAFTAR_HARGA.xlsx + PPN 11% — bar tertinggi = kandidat overstock
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[var(--blue)] tabular">
            Total: {formatRupiahPenuh(grandTotal)}
          </span>
          <ChartExportButtons targetRef={captureRef} filename="grafik-nilai-stok-per-depo" />
        </div>
      </div>

      {depoTertinggi && (
        <div className="mb-3 text-[11px] rounded-md px-3 py-2 bg-[var(--blue-100)] text-[var(--blue)] font-semibold inline-flex items-center gap-1.5">
          Depo dengan nilai stok terbesar: {depoTertinggi.depo} ({formatRupiahPenuh(depoTertinggi.nilai)})
        </div>
      )}

      <div className="flex items-end gap-3 sm:gap-5 h-48 px-1">
        {data.map((d) => {
          const heightPct = Math.max((d.nilai / maxNilai) * 100, 2);
          const isActive = activeDepo === d.depo;
          return (
            <button
              key={d.depo}
              onClick={() => onDepoClick(isActive ? "" : d.depo)}
              className="group flex-1 min-w-0 flex flex-col items-center justify-end h-full gap-1.5"
              title={`${d.depo}: ${formatRupiahPenuh(d.nilai)}`}
            >
              <span
                className={`text-[10px] sm:text-[11px] font-semibold tabular whitespace-nowrap transition-colors ${
                  isActive ? "text-[var(--blue)]" : "text-[var(--muted)] group-hover:text-[var(--blue)]"
                }`}
              >
                {formatRupiahSingkat(d.nilai)}
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
