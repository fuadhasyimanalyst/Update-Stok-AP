"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

/**
 * Dropdown filter dengan kotak pencarian di dalamnya — supaya daftar
 * opsi yang panjang (misal daftar Supplier) gampang dicari, bukan harus
 * di-scroll manual seperti <select> bawaan browser.
 */
export default function SearchableSelect({ label, icon, value, onChange, options, placeholder, labelMap = {} }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

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
  const displayValue = value ? labelMap[value] || value : placeholder;

  function pick(v) {
    onChange(v);
    setOpen(false);
    setQuery("");
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
            value ? "" : "text-[var(--muted)]"
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
                className="w-full pl-7 pr-2 py-2 text-xs outline-none bg-transparent"
              />
            </div>
            <ul className="max-h-56 overflow-y-auto py-1">
              <li>
                <button
                  type="button"
                  onClick={() => pick("")}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--accent-soft)] ${
                    !value ? "font-semibold text-[var(--accent)]" : ""
                  }`}
                >
                  {placeholder}
                </button>
              </li>
              {filteredOptions.map((o) => (
                <li key={o}>
                  <button
                    type="button"
                    onClick={() => pick(o)}
                    title={labelMap[o] || o}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--accent-soft)] whitespace-normal break-words leading-snug ${
                      value === o ? "font-semibold text-[var(--accent)]" : ""
                    }`}
                  >
                    {labelMap[o] || o}
                  </button>
                </li>
              ))}
              {filteredOptions.length === 0 && (
                <li className="px-3 py-2 text-xs text-[var(--muted)]">Tidak ditemukan</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
