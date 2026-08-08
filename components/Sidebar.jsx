"use client";

import { useEffect, useState } from "react";
import { X, ChevronsLeft, ChevronsRight } from "lucide-react";

const COLLAPSE_STORAGE_KEY = "update-stok-sidebar-collapsed";

/**
 * Sidebar navigasi "halaman" stok: Semua Barang, Barang Non Promo, Barang
 * Promo, Aksesoris, dan Supplier Non-Aktif. Memilih salah satu akan
 * mem-filter tabel supaya hanya menampilkan barang di kategori itu saja
 * (menggantikan filter dropdown "Promo" yang lama).
 *
 * Desktop (lg ke atas): kolom tetap di kiri, selalu terlihat, dan bisa
 * "disembunyikan" (dipersempit jadi rel ikon saja) lewat tombol panah di
 * bagian bawah — pilihan ini diingat lewat localStorage.
 * Mobile/tablet: jadi drawer overlay yang dibuka lewat tombol menu di TopBar.
 */
function NavList({ pages, counts, activePage, onSelect, collapsed }) {
  return (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 flex flex-col gap-1">
      {pages.map((p) => {
        const Icon = p.icon;
        const active = activePage === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            title={collapsed ? p.label : undefined}
            className={`flex items-center gap-2.5 rounded-lg text-sm font-semibold text-left transition-colors ${
              collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
            } ${
              active
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--text)] hover:bg-[var(--accent-soft)]"
            }`}
          >
            <Icon size={16} className="shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 min-w-0 leading-snug break-words">{p.label}</span>
                <span
                  className={`text-[10px] font-bold tabular px-1.5 py-0.5 rounded-full shrink-0 self-start ${
                    active ? "bg-white/20 text-white" : "bg-[var(--bg)] text-[var(--muted)]"
                  }`}
                >
                  {counts[p.id] ?? 0}
                </span>
              </>
            )}
          </button>
        );
      })}
    </nav>
  );
}

export default function Sidebar({ pages, counts, activePage, onSelect, isOpen, onClose }) {
  // Status collapse (rel ikon saja) khusus tampilan desktop, diingat lewat
  // localStorage supaya tetap konsisten tiap buka dashboard lagi.
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
      if (raw === "1") setCollapsed(true);
    } catch {
      // abaikan kalau localStorage tidak bisa dibaca
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // abaikan kalau localStorage penuh/diblokir
      }
      return next;
    });
  }

  return (
    <>
      {/* --- Desktop: kolom persisten, bisa dipersempit --- */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen shrink-0 border-r border-[var(--border)] bg-[var(--surface)] print:hidden transition-[width] duration-200 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <div className="px-4 py-4 border-b border-[var(--border)] flex items-center justify-center">
          {!collapsed && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] flex-1">
              Kategori Stok
            </span>
          )}
        </div>
        <NavList pages={pages} counts={counts} activePage={activePage} onSelect={onSelect} collapsed={collapsed} />
        <div className="border-t border-[var(--border)] p-2">
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
            title={collapsed ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--accent-soft)] transition-colors"
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
            {!collapsed && "Sembunyikan"}
          </button>
        </div>
      </aside>

      {/* --- Mobile/tablet: drawer overlay --- */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col transition-transform duration-200 lg:hidden print:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <span className="text-sm font-bold text-[var(--ink)]">Kategori Stok</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="text-[var(--muted)] hover:text-[var(--text)] p-1"
          >
            <X size={18} />
          </button>
        </div>
        <NavList
          pages={pages}
          counts={counts}
          activePage={activePage}
          onSelect={(id) => {
            onSelect(id);
            onClose();
          }}
          collapsed={false}
        />
      </aside>
    </>
  );
}
