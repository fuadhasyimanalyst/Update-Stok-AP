"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ChevronDown, Image as ImageIcon, FileText } from "lucide-react";
import { exportNodeAsJpg, exportNodeAsPdf } from "@/lib/exportChart";

/**
 * Tombol "Download" kecil di pojok kartu grafik — dropdown pilih JPG atau
 * PDF. `targetRef` menunjuk ke elemen DOM yang mau di-screenshot (biasanya
 * pembungkus grafiknya, bukan seluruh kartu, supaya tombol ini sendiri
 * tidak ikut kefoto).
 */
export default function ChartExportButtons({ targetRef, filename }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleExport(kind) {
    if (!targetRef.current || busy) return;
    setOpen(false);
    setBusy(true);
    // Sembunyikan tombol ini sendiri sebentar supaya tidak ikut kefoto
    // (elemen tombol ada di dalam targetRef yang di-screenshot).
    const self = wrapRef.current;
    const prevVisibility = self ? self.style.visibility : "";
    if (self) self.style.visibility = "hidden";
    try {
      if (kind === "jpg") await exportNodeAsJpg(targetRef.current, filename);
      else await exportNodeAsPdf(targetRef.current, filename);
    } catch (err) {
      console.error("Gagal export grafik:", err);
      window.alert("Gagal membuat file. Coba lagi.");
    } finally {
      if (self) self.style.visibility = prevVisibility;
      setBusy(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative print:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--ink-300,#b5b5bd)] transition-colors disabled:opacity-50"
      >
        <Download size={12} /> {busy ? "Memproses..." : "Download"}
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1.5 w-36 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden">
          <button
            type="button"
            onClick={() => handleExport("jpg")}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--accent-soft)] text-left"
          >
            <ImageIcon size={13} className="text-[var(--blue)]" /> Download JPG
          </button>
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--accent-soft)] text-left border-t border-[var(--border)]"
          >
            <FileText size={13} className="text-[var(--dead)]" /> Download PDF
          </button>
        </div>
      )}
    </div>
  );
}
