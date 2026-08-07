"use client";

import { useEffect, useRef, useState } from "react";
import { Columns3 } from "lucide-react";

/**
 * Dropdown untuk memilih kolom tabel mana yang tampil/disembunyikan.
 * `allColumns` = daftar lengkap {key,label}. `visible` = Set key yang aktif.
 * Kolom pertama (biasanya "Nama Barang") sengaja dikunci selalu tampil
 * supaya user tidak bisa menyembunyikan semua kolom sekaligus.
 */
export default function ColumnPicker({ allColumns, visible, onToggle, lockedKey }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--ink-300,#b5b5bd)] transition-colors"
      >
        <Columns3 size={14} /> <span className="hidden sm:inline">Kolom</span>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1.5 w-56 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-[var(--border)] text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Tampilkan Kolom
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {allColumns.map((col) => {
              const isLocked = col.key === lockedKey;
              const isChecked = visible.has(col.key);
              return (
                <li key={col.key}>
                  <label
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-[var(--accent-soft)] ${
                      isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isLocked}
                      onChange={() => onToggle(col.key)}
                      className="accent-[var(--accent)]"
                    />
                    {col.label}
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
