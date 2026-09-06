"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, Check, X } from "lucide-react";

/**
 * Dropdown filter dengan kotak pencarian di dalamnya — supaya daftar
 * opsi yang panjang (misal daftar Supplier) gampang dicari, bukan harus
 * di-scroll manual seperti <select> bawaan browser.
 *
 * Set `multiple` untuk mode multi-pilih: `value` jadi array, dropdown
 * pakai checkbox dan tetap terbuka setelah tiap klik supaya bisa pilih
 * beberapa opsi sekaligus.
 */
export default function SearchableSelect({
  label,
  icon,
  value,
  onChange,
  options,
  placeholder,
  labelMap = {},
  multiple = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const selected = multiple ? (Array.isArray(value) ? value : []) : value;

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const q = query.trim().toLowerCase();
  const filteredOptions = q ? options.filter((o) => (labelMap[o] || o).toLowerCase().includes(q)) : options;

  const hasValue = multiple ? selected.length > 0 : Boolean(selected);
  const displayValue = !hasValue
    ? placeholder
    : multiple
    ? selected.length === 1
      ? labelMap[selected[0]] || selected[0]
      : `${selected.length} dipilih`
    : labelMap[selected] || selected;

  function pick(o) {
    if (multiple) {
      const next = selected.includes(o) ? selected.filter((v) => v !== o) : [...selected, o];
      onChange(next);
      // Dropdown & kotak pencarian tetap terbuka supaya user bisa lanjut
      // memilih beberapa barang sekaligus.
    } else {
      onChange(o);
      setOpen(false);
      setQuery("");
    }
  }

  function clearAll() {
    onChange(multiple ? [] : "");
    if (!multiple) {
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div className="flex flex-col gap-1 min-w-0" ref={wrapRef}>
      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
        {icon}
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`w-full flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-2 text-sm outline-none focus:border-[var(--blue)] transition-colors text-left ${
            hasValue ? "" : "text-[var(--muted)]"
          }`}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronDown
            size={14}
            className={`shrink-0 text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute z-30 mt-1 w-[max(100%,260px)] max-w-[calc(100vw-2rem)] rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden">
            <div className="relative border-b border-[var(--border)]">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari..."
                className="w-full pl-7 pr-7 py-2 text-xs outline-none bg-transparent"
              />
              {multiple && selected.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  title="Hapus semua pilihan"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)]"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <ul className="max-h-56 overflow-y-auto py-1">
              {!multiple && (
                <li>
                  <button
                    type="button"
                    onClick={() => pick("")}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--accent-soft)] ${
                      !selected ? "font-semibold text-[var(--accent)]" : ""
                    }`}
                  >
                    {placeholder}
                  </button>
                </li>
              )}
              {filteredOptions.map((o) => {
                const isSelected = multiple ? selected.includes(o) : selected === o;
                return (
                  <li key={o}>
                    <button
                      type="button"
                      onClick={() => pick(o)}
                      title={labelMap[o] || o}
                      className={`w-full flex items-center gap-2 text-left px-3 py-1.5 text-sm hover:bg-[var(--accent-soft)] whitespace-normal break-words leading-snug ${
                        isSelected ? "font-semibold text-[var(--accent)]" : ""
                      }`}
                    >
                      {multiple && (
                        <span
                          className={`shrink-0 flex items-center justify-center w-4 h-4 rounded border ${
                            isSelected
                              ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                              : "border-[var(--border)]"
                          }`}
                        >
                          {isSelected && <Check size={11} strokeWidth={3} />}
                        </span>
                      )}
                      <span className="truncate">{labelMap[o] || o}</span>
                    </button>
                  </li>
                );
              })}
              {filteredOptions.length === 0 && (
                <li className="px-3 py-2 text-xs text-[var(--muted)]">Tidak ditemukan</li>
              )}
            </ul>
            {multiple && (
              <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] px-3 py-1.5 text-xs">
                <span className="text-[var(--muted)]">{selected.length} dipilih</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="font-semibold text-[var(--accent)] hover:underline"
                >
                  Selesai
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
