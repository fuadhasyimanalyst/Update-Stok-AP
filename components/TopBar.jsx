"use client";

import Image from "next/image";
import { Download } from "lucide-react";

export default function TopBar({ asOfDate, onExport }) {
  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center gap-3 min-w-0">
        <Image
          src="/logo-api.webp"
          alt="Logo AP"
          width={38}
          height={38}
          className="rounded-lg shrink-0 object-contain"
        />
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-[var(--ink)] truncate">
            Update Stok
          </h1>
          <p className="text-xs text-[var(--muted)] font-medium mt-0.5 truncate">
            Fast / Slow Moving &amp; Dead Stock &middot; Data per: {asOfDate || "—"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-end">
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[var(--accent)] text-white hover:bg-[var(--brand-700,#b91c1c)] transition-colors shadow-sm"
        >
          <Download size={14} /> <span className="hidden sm:inline">Export Excel</span>
        </button>
      </div>
    </header>
  );
}
