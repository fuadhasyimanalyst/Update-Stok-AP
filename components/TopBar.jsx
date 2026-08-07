"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Download, Printer, ChevronDown, FileSpreadsheet, FileText } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function TopBar({ asOfDate, onExportExcel, onExportPdf, onPrint }) {
  const [exportOpen, setExportOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setExportOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur px-4 sm:px-6 py-3 sm:py-4 print:static print:bg-white print:backdrop-blur-none">
      <div className="flex items-center gap-3 min-w-0">
        <Image
          src="/logo-api.webp"
          alt="Logo AP"
          width={38}
          height={38}
          style={{ width: "38px", height: "38px" }}
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

      <div className="flex items-center gap-2 flex-wrap justify-end print:hidden">
        <ThemeToggle />

        <button
          onClick={onPrint}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--ink-300,#b5b5bd)] transition-colors"
        >
          <Printer size={14} /> <span className="hidden sm:inline">Print</span>
        </button>

        <div ref={wrapRef} className="relative">
          <button
            onClick={() => setExportOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[var(--accent)] text-white hover:bg-[var(--brand-700,#b91c1c)] transition-colors shadow-sm"
          >
            <Download size={14} /> <span className="hidden sm:inline">Export</span>
            <ChevronDown size={13} className={`transition-transform ${exportOpen ? "rotate-180" : ""}`} />
          </button>

          {exportOpen && (
            <div className="absolute right-0 z-30 mt-1.5 w-44 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden">
              <button
                onClick={() => {
                  setExportOpen(false);
                  onExportExcel();
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[var(--accent-soft)] text-left"
              >
                <FileSpreadsheet size={15} className="text-[var(--fast)]" /> Export Excel
              </button>
              <button
                onClick={() => {
                  setExportOpen(false);
                  onExportPdf();
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[var(--accent-soft)] text-left border-t border-[var(--border)]"
              >
                <FileText size={15} className="text-[var(--dead)]" /> Export PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
