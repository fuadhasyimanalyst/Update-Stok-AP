"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import * as XLSX from "xlsx";
import StatCard from "./StatCard";
import CategoryBadge from "./CategoryBadge";
import DepoHealthBars from "./DepoHealthBars";

const PAGE_SIZE = 50;

function uniqueSorted(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function formatQty(n) {
  return new Intl.NumberFormat("id-ID").format(n);
}

export default function Dashboard({ rows, asOfDate, generatedAt }) {
  const [search, setSearch] = useState("");
  const [depo, setDepo] = useState("");
  const [supp, setSupp] = useState("");
  const [kategori, setKategori] = useState("");
  const [gudang, setGudang] = useState("");
  const [promo, setPromo] = useState(""); // "" = semua, "YA" = promo, "TIDAK" = non promo
  const [sortKey, setSortKey] = useState("NAMA_BARANG");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);

  const options = useMemo(
    () => ({
      depo: uniqueSorted(rows.map((r) => r.DEPO)),
      supp: uniqueSorted(rows.map((r) => r.SUPP)),
      kategori: uniqueSorted(rows.map((r) => r.KATEGORI)),
      gudang: uniqueSorted(rows.map((r) => r.GUDANG)),
    }),
    [rows]
  );

  const filteredByPanel = useMemo(() => {
    // filters excluding depo (used to compute per-depo health bars honoring other filters)
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (supp && r.SUPP !== supp) return false;
      if (kategori && r.KATEGORI !== kategori) return false;
      if (gudang && r.GUDANG !== gudang) return false;
      if (promo && r.BARANG_PROMO !== promo) return false;
      if (q && !`${r.NAMA_BARANG} ${r.KODE_BARANG}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, supp, kategori, gudang, promo]);

  const filtered = useMemo(() => {
    if (!depo) return filteredByPanel;
    return filteredByPanel.filter((r) => r.DEPO === depo);
  }, [filteredByPanel, depo]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      let cmp;
      if (typeof va === "number" && typeof vb === "number") {
        cmp = va - vb;
      } else {
        cmp = String(va).localeCompare(String(vb));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageClamped = Math.min(page, totalPages);
  const pageRows = sorted.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE);

  const stats = useMemo(() => {
    const acc = { totalQty: 0, fast: 0, slow: 0, dead: 0, unknown: 0, promo: 0 };
    for (const r of filtered) {
      acc.totalQty += r.QTY;
      if (r.KATEGORI === "Fast Moving") acc.fast += 1;
      else if (r.KATEGORI === "Slow Moving") acc.slow += 1;
      else if (r.KATEGORI === "DEAD") acc.dead += 1;
      else acc.unknown += 1;
      if (r.BARANG_PROMO === "YA") acc.promo += 1;
    }
    return acc;
  }, [filtered]);

  const depoStats = useMemo(() => {
    const map = new Map();
    for (const r of filteredByPanel) {
      if (!map.has(r.DEPO)) map.set(r.DEPO, { depo: r.DEPO, fast: 0, slow: 0, dead: 0, unknown: 0 });
      const d = map.get(r.DEPO);
      if (r.KATEGORI === "Fast Moving") d.fast += 1;
      else if (r.KATEGORI === "Slow Moving") d.slow += 1;
      else if (r.KATEGORI === "DEAD") d.dead += 1;
      else d.unknown += 1;
    }
    return Array.from(map.values()).sort((a, b) => a.depo.localeCompare(b.depo));
  }, [filteredByPanel]);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  function resetFilters() {
    setSearch("");
    setDepo("");
    setSupp("");
    setKategori("");
    setGudang("");
    setPromo("");
    setPage(1);
  }

  function exportExcel() {
    // Susun data sesuai kolom yang tampil di tabel, dengan header rapi (bukan field mentah)
    const headers = [
      "Kode Barang",
      "Nama Barang",
      "Satuan",
      "Qty",
      "Gudang",
      "Depo",
      "Supp",
      "Kategori",
      "Promo",
    ];
    const body = sorted.map((r) => [
      r.KODE_BARANG,
      r.NAMA_BARANG,
      r.SATUAN,
      r.QTY,
      r.GUDANG,
      r.DEPO,
      r.SUPP,
      r.KATEGORI === "DEAD" ? "Dead Stock" : r.KATEGORI,
      r.BARANG_PROMO === "YA" ? "Promo" : "Non Promo",
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...body]);

    // Lebar kolom otomatis biar rapi, tidak kepotong
    worksheet["!cols"] = headers.map((h, i) => {
      const maxLen = Math.max(
        h.length,
        ...body.map((row) => String(row[i] ?? "").length)
      );
      return { wch: Math.min(Math.max(maxLen + 2, 10), 45) };
    });

    // Aktifkan autofilter di baris header supaya bisa langsung difilter/disortir di Excel
    worksheet["!autofilter"] = { ref: worksheet["!ref"] };

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Update Stok");

    XLSX.writeFile(
      workbook,
      `update-stok${asOfDate ? "-" + asOfDate : ""}.xlsx`
    );
  }

  const columns = [
    { key: "KODE_BARANG", label: "Kode Barang" },
    { key: "NAMA_BARANG", label: "Nama Barang" },
    { key: "SATUAN", label: "Satuan" },
    { key: "QTY", label: "Qty", numeric: true },
    { key: "GUDANG", label: "Gudang" },
    { key: "DEPO", label: "Depo" },
    { key: "SUPP", label: "Supp" },
    { key: "KATEGORI", label: "Kategori" },
    { key: "BARANG_PROMO", label: "Promo" },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="bg-[var(--ink)] text-white">
        <div className="mx-auto max-w-[1400px] px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Logo" width={44} height={44} className="rounded-lg" />
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-xl tracking-wide leading-none">
                UPDATE STOK
              </h1>
              <p className="text-xs text-white/60 mt-1">
                Dashboard stok multi-depo &middot; Fast / Slow Moving &amp; Dead Stock
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full bg-white/10 px-3 py-1.5 font-medium tabular">
              Data per: {asOfDate || "—"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-6 flex flex-col gap-5">
        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total SKU" value={formatQty(filtered.length)} />
          <StatCard label="Total Qty" value={formatQty(stats.totalQty)} />
          <StatCard label="Fast Moving" value={formatQty(stats.fast)} accentColor="var(--fast)" />
          <StatCard label="Slow Moving" value={formatQty(stats.slow)} accentColor="var(--slow)" />
          <StatCard label="Dead Stock" value={formatQty(stats.dead)} accentColor="var(--dead)" />
          <StatCard label="Barang Promo" value={formatQty(stats.promo)} accentColor="var(--accent)" />
        </div>

        {/* Signature health bars */}
        <DepoHealthBars depoStats={depoStats} onDepoClick={setDepo} activeDepo={depo} />

        {/* Filter toolbar */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama / kode barang..."
            className="flex-1 min-w-[200px] rounded-md border border-[var(--border)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)] transition-colors"
          />

          <Select value={depo} onChange={(v) => { setDepo(v); setPage(1); }} options={options.depo} placeholder="Semua Depo" />
          <Select value={supp} onChange={(v) => { setSupp(v); setPage(1); }} options={options.supp} placeholder="Semua Supplier" />
          <Select value={kategori} onChange={(v) => { setKategori(v); setPage(1); }} options={options.kategori} placeholder="Semua Kategori" labelMap={{ DEAD: "Dead Stock", "-": "Belum Dikategorikan" }} />
          <Select value={gudang} onChange={(v) => { setGudang(v); setPage(1); }} options={options.gudang} placeholder="Semua Gudang" />

          <Select
            value={promo}
            onChange={(v) => { setPromo(v); setPage(1); }}
            options={["YA", "TIDAK"]}
            placeholder="Semua (Promo & Non Promo)"
            labelMap={{ YA: "Barang Promo", TIDAK: "Barang Non Promo" }}
          />

          <button
            onClick={resetFilters}
            className="text-sm px-3 py-1.5 rounded-md border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--muted)] transition-colors"
          >
            Reset
          </button>
          <button
            onClick={exportExcel}
            className="text-sm px-3 py-1.5 rounded-md bg-[var(--ink)] text-white hover:bg-[var(--ink-soft)] transition-colors"
          >
            Export Excel
          </button>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[var(--bg)] border-b border-[var(--border)]">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className={`px-3 py-2.5 text-left font-semibold text-[11px] uppercase tracking-wider text-[var(--muted)] cursor-pointer select-none whitespace-nowrap hover:text-[var(--text)] ${
                        col.numeric ? "text-right" : ""
                      }`}
                    >
                      {col.label}
                      {sortKey === col.key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`border-b border-[var(--border)] last:border-0 ${
                      i % 2 === 1 ? "bg-[var(--bg)]/40" : ""
                    } hover:bg-[var(--accent-soft)]/40 transition-colors`}
                  >
                    <td className="px-3 py-2 font-[family-name:var(--font-mono)] text-xs whitespace-nowrap">
                      {r.KODE_BARANG}
                    </td>
                    <td className="px-3 py-2 max-w-[320px] truncate" title={r.NAMA_BARANG}>
                      {r.NAMA_BARANG}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.SATUAN}</td>
                    <td className="px-3 py-2 text-right font-[family-name:var(--font-mono)] tabular whitespace-nowrap">
                      {formatQty(r.QTY)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.GUDANG}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-medium">{r.DEPO}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.SUPP}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <CategoryBadge value={r.KATEGORI} />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.BARANG_PROMO === "YA" ? (
                        <span className="text-[var(--accent)] font-semibold text-xs">● PROMO</span>
                      ) : (
                        <span className="text-[var(--muted)] text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="px-3 py-10 text-center text-[var(--muted)] text-sm">
                      Tidak ada barang yang cocok dengan filter ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] text-sm">
            <span className="text-[var(--muted)]">
              Menampilkan {pageRows.length === 0 ? 0 : (pageClamped - 1) * PAGE_SIZE + 1}
              {"–"}
              {Math.min(pageClamped * PAGE_SIZE, sorted.length)} dari {formatQty(sorted.length)} barang
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pageClamped <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-md border border-[var(--border)] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[var(--muted)]"
              >
                ‹ Sebelumnya
              </button>
              <span className="tabular text-[var(--muted)]">
                {pageClamped} / {totalPages}
              </span>
              <button
                disabled={pageClamped >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-md border border-[var(--border)] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[var(--muted)]"
              >
                Berikutnya ›
              </button>
            </div>
          </div>
        </div>

        <footer className="text-center text-xs text-[var(--muted)] pb-4">
          Data diproses dari SaldoStock.xls, SUPPLIER.xlsx &amp; KATEGORI_BARANG.xlsx &middot; dibuat{" "}
          {new Date(generatedAt).toLocaleString("id-ID")}
        </footer>
      </main>
    </div>
  );
}

function Select({ value, onChange, options, placeholder, labelMap = {} }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-sm bg-white outline-none focus:border-[var(--accent)] transition-colors"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {labelMap[o] || o}
        </option>
      ))}
    </select>
  );
}
