"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, Clock } from "lucide-react";

const STORAGE_KEY = "update-stok-search-history";
const MAX_HISTORY = 8;

function loadHistory() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(list) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // localStorage bisa gagal (mode private/incognito penuh) — abaikan saja
  }
}

/**
 * Input pencarian barang dengan riwayat pencarian tersimpan di localStorage.
 * Riwayat muncul sebagai dropdown saat input difokuskan, memudahkan user
 * mengulang pencarian barang yang sama tanpa mengetik ulang.
 */
export default function SearchWithHistory({ value, onChange, placeholder }) {
  const [history, setHistory] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function commitToHistory(term) {
    const trimmed = term.trim();
    if (!trimmed) return;
    setHistory((prev) => {
      const next = [trimmed, ...prev.filter((h) => h.toLowerCase() !== trimmed.toLowerCase())].slice(
        0,
        MAX_HISTORY
      );
      saveHistory(next);
      return next;
    });
  }

  function removeItem(term) {
    setHistory((prev) => {
      const next = prev.filter((h) => h !== term);
      saveHistory(next);
      return next;
    });
  }

  function clearAll() {
    setHistory([]);
    saveHistory([]);
  }

  function pick(term) {
    onChange(term);
    commitToHistory(term);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commitToHistory(value);
            setOpen(false);
            e.currentTarget.blur();
          }
          if (e.key === "Escape") setOpen(false);
        }}
        onBlur={() => {
          // commit ke history sedikit ditunda supaya klik item history sempat terdaftar
          if (value.trim()) commitToHistory(value);
        }}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-8 pr-3 py-2 text-sm outline-none focus:border-[var(--blue)] transition-colors"
      />

      {open && history.length > 0 && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border)]">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              <Clock size={11} /> Pencarian Terakhir
            </span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={clearAll}
              className="text-[10px] text-[var(--muted)] hover:text-[var(--accent)] font-semibold"
            >
              Hapus Semua
            </button>
          </div>
          <ul className="max-h-56 overflow-y-auto">
            {history.map((term) => (
              <li
                key={term}
                className="flex items-center justify-between px-3 py-1.5 text-sm hover:bg-[var(--accent-soft)] cursor-pointer group"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(term);
                }}
              >
                <span className="truncate">{term}</span>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeItem(term);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-[var(--muted)] hover:text-[var(--accent)] shrink-0 ml-2"
                  aria-label={`Hapus "${term}" dari riwayat`}
                >
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
