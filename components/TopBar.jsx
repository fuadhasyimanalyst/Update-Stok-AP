"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Download, Printer, ChevronDown, FileSpreadsheet, FileText, Menu, RefreshCw } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const HARI_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function formatSyncTime(generatedAt) {
  if (!generatedAt) return null;
  const d = new Date(generatedAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

// asOfDate formatnya "DD-MM-YYYY" (mis. "10-08-2026") -> tambahkan nama hari
// di depannya jadi "Senin, 10-08-2026".
function formatAsOfDateWithDay(asOfDate) {
  if (!asOfDate) return null;
  const match = String(asOfDate).match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return asOfDate;
  const [, dd, mm, yyyy] = match;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (Number.isNaN(d.getTime())) return asOfDate;
  return `${HARI_ID[d.getDay()]}, ${asOfDate}`;
}

export default function TopBar({ asOfDate, generatedAt, onExportExcel, onExportPdf, onPrint, onMenuClick }) {
  const syncTime = formatSyncTime(generatedAt);
  const [exportOpen, setExportOpen] = useState(false);
  const wrapRef = useRef(null);
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();

  function handleRefresh() {
    // router.refresh() menjalankan ulang Server Component (app/page.js) yang
    // mengambil data langsung dari Supabase, jadi data di layar ikut ter-update
    // tanpa perlu reload penuh halaman.
    startRefresh(() => {
      router.refresh();
    });
  }

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setExportOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur px-4 sm:px-6 py-3 sm:py-4 print:static print:bg-white print:backdrop-blur-none">
      <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Buka menu kategori"
          className="lg:hidden shrink-0 p-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] print:hidden"
        >
          <Menu size={18} />
        </button>
        <Image
          src="/logo-api.webp"
          alt="Logo AP"
          width={38}
          height={38}
          style={{ width: "38px", height: "38px" }}
          className="rounded-lg shrink-0 object-contain"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-[var(--ink)]">
            Update Stok
          </h1>
          <p className="text-[11px] sm:text-xs font-semibold mt-0.5 leading-snug">
            <span className="text-[var(--muted)] font-medium">Fast / Slow Moving &amp; Dead Stock &middot; </span>
            <span className="text-emerald-600 dark:text-emerald-400">
              Data per: {formatAsOfDateWithDay(asOfDate) || "—"}
              {syncTime ? ` · Update jam ${syncTime}` : ""}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto print:hidden">
        <ThemeToggle />

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-label="Refresh data dari Supabase"
          title="Ambil ulang data terbaru dari Supabase"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--ink-300,#b5b5bd)] transition-colors disabled:opacity-60 disabled:cursor-wait"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          <span className="hidden sm:inline">{isRefreshing ? "Refreshing…" : "Refresh"}</span>
        </button>

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
