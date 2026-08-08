"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Package,
  Layers,
  Zap,
  Clock,
  AlertTriangle,
  Tag,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Sparkles,
  Ban,
} from "lucide-react";
import StatCard from "./StatCard";
import CategoryBadge, { CATEGORY_STYLES } from "./CategoryBadge";
import DepoHealthBars from "./DepoHealthBars";
import QtyPerDepoChart from "./QtyPerDepoChart";
import FilterBar from "./FilterBar";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import ScrollToTopButton from "./ScrollToTopButton";
import ColumnPicker from "./ColumnPicker";
import { exportStockToPdf } from "@/lib/exportPdf";

const PAGE_SIZE = 50;
const COLUMN_STORAGE_KEY = "update-stok-visible-columns";
const LOCKED_COLUMN = "NAMA_BARANG"; // kolom ini selalu tampil, tidak bisa disembunyikan

// Kata kunci nama barang yang dianggap "Aksesoris" (aksesoris panjang/pendek,
// gayung, panel, dsb.) — barang ini punya page sendiri, jadi tidak dobel
// muncul di page Barang Promo / Non Promo.
const ACCESSORY_KEYWORDS = ["AKSESORIS", "GAYUNG", "PANEL"];

// Supplier yang sudah tidak bermitra lagi tapi masih ada sisa stoknya.
// Tambahkan nama supplier lain di sini kalau ada kasus serupa nanti.
const DISCONTINUED_SUPPLIERS = ["PACIFIC"];

function isAccessory(row) {
  const name = (row.NAMA_BARANG || "").toUpperCase();
  return ACCESSORY_KEYWORDS.some((kw) => name.includes(kw));
}

function isDiscontinuedSupplier(row) {
  const text = `${row.SUPP || ""} ${row.CGRPDESC || ""}`.toUpperCase();
  return DISCONTINUED_SUPPLIERS.some((kw) => text.includes(kw));
}

// Setiap barang jatuh ke SATU kategori page saja (urutan prioritas di bawah),
// supaya tidak ada barang yang dobel tampil di 2 page berbeda.
function classifyRow(row) {
  if (isDiscontinuedSupplier(row)) return "nonaktif";
  if (isAccessory(row)) return "aksesoris";
  return row.BARANG_PROMO === "YA" ? "promo" : "nonpromo";
}

const PAGES = [
  {
    id: "nonpromo",
    label: "Barang Non Promo",
    description: "Barang reguler di luar promo dan aksesoris.",
    icon: Package,
  },
  { id: "promo", label: "Barang Promo", description: "Barang yang sedang berstatus promo.", icon: Tag },
  { id: "semua", label: "Semua Barang", description: "Seluruh stok dari semua kategori.", icon: LayoutGrid },
  {
    id: "aksesoris",
    label: "Aksesoris",
    description: "Aksesoris panjang/pendek, gayung, panel, dan sejenisnya.",
    icon: Sparkles,
  },
  {
    id: "nonaktif",
    label: "Supplier Non-Aktif",
    description: "Sisa stok dari supplier yang sudah tidak bermitra lagi (mis. Pacific).",
    icon: Ban,
  },
];

const ALL_COLUMNS = [
  { key: "NAMA_BARANG", label: "Nama Barang" },
  { key: "QTY", label: "Qty", numeric: true },
  { key: "DEPO", label: "Depo" },
  { key: "SUPP", label: "Supp" },
  { key: "CGRPDESC", label: "SUPP_FULL" },
  { key: "GUDANG", label: "Gudang" },
  { key: "KODE_BARANG", label: "Kode Barang" },
  { key: "SATUAN", label: "Satuan" },
  { key: "KATEGORI", label: "Kategori" },
  { key: "BARANG_PROMO", label: "Promo" },
];

function uniqueSorted(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function formatQty(n) {
  return new Intl.NumberFormat("id-ID").format(n);
}

function categoryColor(value) {
  const style = CATEGORY_STYLES[value] || CATEGORY_STYLES["-"];
  return style.fg;
}

export default function Dashboard({ rows, asOfDate, generatedAt }) {
  const [activePage, setActivePage] = useState("nonpromo");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [namaBarang, setNamaBarang] = useState("");
  const [depo, setDepo] = useState("");
  const [supp, setSupp] = useState("");
  const [kategori, setKategori] = useState("");
  const [gudang, setGudang] = useState("");
  const [sortKey, setSortKey] = useState("NAMA_BARANG");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);

  // Menahan tinggi tabel supaya tidak "loncat" naik-turun saat mengetik di
  // kolom pencarian (jumlah baris hasil filter berubah tiap ketukan huruf).
  // Direset ke 0 tiap pindah page sidebar, supaya tidak kebawa tinggi dari
  // page lain yang datanya jauh lebih banyak.
  const [tableMinHeight, setTableMinHeight] = useState(0);
  const tableWrapRef = useRef(null);

  useEffect(() => {
    setTableMinHeight(0);
  }, [activePage]);

  const currentPageMeta = PAGES.find((p) => p.id === activePage) || PAGES[0];

  // Kolom tabel yang tampil — default semua tampil, lalu dipulihkan dari
  // localStorage kalau user pernah mengatur ulang sebelumnya.
  const [visibleColumns, setVisibleColumns] = useState(
    () => new Set(ALL_COLUMNS.map((c) => c.key))
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COLUMN_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved) && saved.length > 0) {
          setVisibleColumns(new Set(saved));
        }
      }
    } catch {
      // abaikan kalau localStorage tidak bisa dibaca
    }
  }, []);

  function toggleColumn(key) {
    if (key === LOCKED_COLUMN) return;
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        window.localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // abaikan kalau localStorage penuh/diblokir
      }
      return next;
    });
  }

  // Jumlah barang per page (dihitung dari SELURUH data, bukan hasil filter),
  // dipakai untuk badge angka di Sidebar.
  const pageCounts = useMemo(() => {
    const counts = { semua: rows.length, promo: 0, nonpromo: 0, aksesoris: 0, nonaktif: 0 };
    for (const r of rows) {
      counts[classifyRow(r)] += 1;
    }
    return counts;
  }, [rows]);

  // Subset data untuk page sidebar yang sedang aktif.
  const pageRowsAll = useMemo(() => {
    if (activePage === "semua") return rows;
    return rows.filter((r) => classifyRow(r) === activePage);
  }, [rows, activePage]);

  function selectPage(id) {
    setActivePage(id);
    setNamaBarang("");
    setDepo("");
    setSupp("");
    setKategori("");
    setGudang("");
    setPage(1);
  }

  // Opsi dropdown filter bersifat "cascading": tiap dropdown menghitung
  // opsinya dari data yang sudah dipersempit oleh filter LAIN yang aktif
  // (dirinya sendiri dikecualikan). Jadi kalau Supplier = "Milan" dipilih,
  // opsi Depo/Kategori/Gudang otomatis hanya berisi nilai yang benar-benar
  // ada di barang-barang Milan.
  function matchesOtherFilters(r, excludeKey) {
    if (excludeKey !== "namaBarang" && namaBarang && r.NAMA_BARANG !== namaBarang) return false;
    if (excludeKey !== "depo" && depo && r.DEPO !== depo) return false;
    if (excludeKey !== "supp" && supp && r.SUPP !== supp) return false;
    if (excludeKey !== "kategori" && kategori && r.KATEGORI !== kategori) return false;
    if (excludeKey !== "gudang" && gudang && r.GUDANG !== gudang) return false;
    return true;
  }

  const options = useMemo(
    () => ({
      namaBarang: uniqueSorted(
        pageRowsAll.filter((r) => matchesOtherFilters(r, "namaBarang")).map((r) => r.NAMA_BARANG)
      ),
      depo: uniqueSorted(pageRowsAll.filter((r) => matchesOtherFilters(r, "depo")).map((r) => r.DEPO)),
      supp: uniqueSorted(pageRowsAll.filter((r) => matchesOtherFilters(r, "supp")).map((r) => r.SUPP)),
      kategori: uniqueSorted(pageRowsAll.filter((r) => matchesOtherFilters(r, "kategori")).map((r) => r.KATEGORI)),
      gudang: uniqueSorted(pageRowsAll.filter((r) => matchesOtherFilters(r, "gudang")).map((r) => r.GUDANG)),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pageRowsAll, namaBarang, depo, supp, kategori, gudang]
  );

  const filteredByPanel = useMemo(() => {
    // filters excluding depo (used to compute per-depo health bars & qty chart honoring other filters)
    return pageRowsAll.filter((r) => {
      if (namaBarang && r.NAMA_BARANG !== namaBarang) return false;
      if (supp && r.SUPP !== supp) return false;
      if (kategori && r.KATEGORI !== kategori) return false;
      if (gudang && r.GUDANG !== gudang) return false;
      return true;
    });
  }, [pageRowsAll, namaBarang, supp, kategori, gudang]);

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

  useEffect(() => {
    if (tableWrapRef.current) {
      const h = tableWrapRef.current.offsetHeight;
      setTableMinHeight((prev) => Math.max(prev, h));
    }
  }, [pageRows.length, pageClamped]);

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

  const depoQty = useMemo(() => {
    const map = new Map();
    for (const r of filteredByPanel) {
      map.set(r.DEPO, (map.get(r.DEPO) || 0) + r.QTY);
    }
    return Array.from(map.entries())
      .map(([depoName, qty]) => ({ depo: depoName, qty }))
      .sort((a, b) => b.qty - a.qty);
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
    setNamaBarang("");
    setDepo("");
    setSupp("");
    setKategori("");
    setGudang("");
    setPage(1);
  }

  function exportExcel() {
    // Ikuti urutan & visibilitas kolom yang sedang tampil di tabel (termasuk
    // hasil pengaturan "Kolom"), supaya Excel selalu konsisten dengan layar.
    const headers = columns.map((c) => c.label);
    const body = sorted.map((r) =>
      columns.map((c) => {
        if (c.key === "KATEGORI") return r.KATEGORI === "DEAD" ? "Dead Stock" : r.KATEGORI;
        if (c.key === "BARANG_PROMO") return r.BARANG_PROMO === "YA" ? "Promo" : "Non Promo";
        return r[c.key];
      })
    );
    const totalRow = columns.map((c) => {
      if (c.key === "NAMA_BARANG") return "GRAND TOTAL";
      if (c.key === "QTY") return stats.totalQty;
      return "";
    });
    body.push(totalRow);

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
    worksheet["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: body.length - 1, c: headers.length - 1 } }) };

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Update Stok");

    XLSX.writeFile(
      workbook,
      `update-stok${activePage !== "semua" ? "-" + activePage : ""}${asOfDate ? "-" + asOfDate : ""}.xlsx`
    );
  }

  const columns = ALL_COLUMNS.filter((c) => visibleColumns.has(c.key));

  function renderCell(col, r, color) {
    switch (col.key) {
      case "KODE_BARANG":
        return (
          <td key={col.key} className="px-3 py-2 font-[family-name:var(--font-mono)] text-xs whitespace-nowrap font-semibold" style={{ color }}>
            {r.KODE_BARANG}
          </td>
        );
      case "NAMA_BARANG":
        return (
          <td key={col.key} className="px-3 py-2 max-w-[320px] truncate font-medium" style={{ color }} title={r.NAMA_BARANG}>
            {r.NAMA_BARANG}
          </td>
        );
      case "SATUAN":
        return (
          <td key={col.key} className="px-3 py-2 whitespace-nowrap">
            {r.SATUAN}
          </td>
        );
      case "QTY":
        return (
          <td key={col.key} className="px-3 py-2 text-right font-[family-name:var(--font-mono)] tabular whitespace-nowrap">
            {formatQty(r.QTY)}
          </td>
        );
      case "GUDANG":
        return (
          <td key={col.key} className="px-3 py-2 whitespace-nowrap">
            {r.GUDANG}
          </td>
        );
      case "DEPO":
        return (
          <td key={col.key} className="px-3 py-2 whitespace-nowrap font-medium">
            {r.DEPO}
          </td>
        );
      case "SUPP":
        return (
          <td key={col.key} className="px-3 py-2 whitespace-nowrap">
            {r.SUPP}
          </td>
        );
      case "KATEGORI":
        return (
          <td key={col.key} className="px-3 py-2 whitespace-nowrap">
            <CategoryBadge value={r.KATEGORI} />
          </td>
        );
      case "BARANG_PROMO":
        return (
          <td key={col.key} className="px-3 py-2 whitespace-nowrap">
            {r.BARANG_PROMO === "YA" ? (
              <span className="text-[var(--accent)] font-semibold text-xs">● PROMO</span>
            ) : (
              <span className="text-[var(--muted)] text-xs">—</span>
            )}
          </td>
        );
      default:
        return <td key={col.key} className="px-3 py-2 whitespace-nowrap">{r[col.key]}</td>;
    }
  }

  const qtyColIndex = columns.findIndex((c) => c.key === "QTY");

  function exportPdf() {
    exportStockToPdf({
      rows: sorted,
      columns,
      asOfDate,
      stats,
      pageTitle: activePage !== "semua" ? currentPageMeta.label : null,
    });
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] lg:flex">
      <Sidebar
        pages={PAGES}
        counts={pageCounts}
        activePage={activePage}
        onSelect={selectPage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0">
        <TopBar
          asOfDate={asOfDate}
          generatedAt={generatedAt}
          onExportExcel={exportExcel}
          onExportPdf={exportPdf}
          onPrint={handlePrint}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="px-4 sm:px-6 py-6 flex flex-col gap-5 max-w-[1600px] mx-auto">
        {/* Judul page yang sedang aktif */}
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[var(--ink)]">{currentPageMeta.label}</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">{currentPageMeta.description}</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total SKU" value={formatQty(filtered.length)} icon={Package} accentColor="var(--blue)" />
          <StatCard label="Total Qty" value={formatQty(stats.totalQty)} icon={Layers} accentColor="var(--ink)" />
          <StatCard label="Fast Moving" value={formatQty(stats.fast)} icon={Zap} accentColor="var(--fast)" />
          <StatCard label="Slow Moving" value={formatQty(stats.slow)} icon={Clock} accentColor="var(--slow)" />
          <StatCard label="Dead Stock" value={formatQty(stats.dead)} icon={AlertTriangle} accentColor="var(--dead)" />
          <StatCard label="Barang Promo" value={formatQty(stats.promo)} icon={Tag} accentColor="var(--violet)" />
        </div>

        {/* Qty per Depo bar chart */}
        <div className="print:hidden">
          <QtyPerDepoChart data={depoQty} onDepoClick={setDepo} activeDepo={depo} />
        </div>

        {/* Signature health bars */}
        <div className="print:hidden">
          <DepoHealthBars depoStats={depoStats} onDepoClick={setDepo} activeDepo={depo} />
        </div>

        {/* Table with filters on top */}
        <div className="card overflow-hidden print:shadow-none print:border-none">
          <div className="print:hidden">
            <FilterBar
              options={options}
              namaBarang={namaBarang}
              setNamaBarang={(v) => { setNamaBarang(v); setPage(1); }}
              depo={depo}
              setDepo={(v) => { setDepo(v); setPage(1); }}
              supp={supp}
              setSupp={(v) => { setSupp(v); setPage(1); }}
              kategori={kategori}
              setKategori={(v) => { setKategori(v); setPage(1); }}
              gudang={gudang}
              setGudang={(v) => { setGudang(v); setPage(1); }}
              onReset={resetFilters}
            />
          </div>

          <div className="flex justify-end px-4 sm:px-5 py-3 border-b border-[var(--border)] print:hidden">
            <ColumnPicker
              allColumns={ALL_COLUMNS}
              visible={visibleColumns}
              onToggle={toggleColumn}
              lockedKey={LOCKED_COLUMN}
            />
          </div>

          <div ref={tableWrapRef} className="overflow-x-auto print:hidden" style={{ minHeight: tableMinHeight || undefined }}>

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
                {pageRows.map((r, i) => {
                  const color = categoryColor(r.KATEGORI);
                  return (
                    <tr
                      key={r.id}
                      className={`border-b border-[var(--border)] last:border-0 ${
                        i % 2 === 1 ? "bg-[var(--bg)]/40" : ""
                      } hover:bg-[var(--accent-soft)]/40 transition-colors`}
                    >
                      {columns.map((col) => renderCell(col, r, color))}
                    </tr>
                  );
                })}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="px-3 py-10 text-center text-[var(--muted)] text-sm">
                      Tidak ada barang yang cocok dengan filter ini.
                    </td>
                  </tr>
                )}
              </tbody>
              {pageRows.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-[var(--border)] bg-[var(--bg)] font-bold">
                    {qtyColIndex === -1 ? (
                      <td colSpan={columns.length} className="px-3 py-2.5 text-xs uppercase tracking-wider text-[var(--ink)]">
                        Grand Total ({formatQty(sorted.length)} SKU)
                      </td>
                    ) : (
                      <>
                        {qtyColIndex > 0 && (
                          <td colSpan={qtyColIndex} className="px-3 py-2.5 text-xs uppercase tracking-wider text-[var(--ink)]">
                            Grand Total ({formatQty(sorted.length)} SKU)
                          </td>
                        )}
                        <td className="px-3 py-2.5 text-right font-[family-name:var(--font-mono)] tabular text-[var(--ink)] whitespace-nowrap">
                          {qtyColIndex === 0 ? `Grand Total (${formatQty(sorted.length)} SKU) — ` : ""}
                          {formatQty(stats.totalQty)}
                        </td>
                        {qtyColIndex < columns.length - 1 && (
                          <td colSpan={columns.length - qtyColIndex - 1} className="px-3 py-2.5" />
                        )}
                      </>
                    )}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Tabel khusus cetak/PDF-browser: menampilkan SEMUA barang hasil filter
              (bukan cuma 1 halaman), supaya hasil print/simpan-sebagai-PDF lengkap. */}
          <div className="hidden print:block overflow-visible">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="border-b-2 border-black">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-2 py-1.5 text-left font-bold uppercase tracking-wide whitespace-nowrap ${
                        col.numeric ? "text-right" : ""
                      }`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.id} className="border-b border-black/20 break-inside-avoid">
                    {columns.map((col) => renderCell(col, r, undefined))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-black font-bold">
                  {qtyColIndex === -1 ? (
                    <td colSpan={columns.length} className="px-2 py-1.5 text-[10px] uppercase">
                      Grand Total ({formatQty(sorted.length)} SKU)
                    </td>
                  ) : (
                    <>
                      {qtyColIndex > 0 && (
                        <td colSpan={qtyColIndex} className="px-2 py-1.5 text-[10px] uppercase">
                          Grand Total ({formatQty(sorted.length)} SKU)
                        </td>
                      )}
                      <td className="px-2 py-1.5 text-right whitespace-nowrap">{formatQty(stats.totalQty)}</td>
                      {qtyColIndex < columns.length - 1 && (
                        <td colSpan={columns.length - qtyColIndex - 1} className="px-2 py-1.5" />
                      )}
                    </>
                  )}
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Pagination — dibuat ringkas di layar kecil (ikon saja, tanpa teks
              "Sebelumnya/Berikutnya" yang memakan tempat di HP) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 px-3 sm:px-4 py-2.5 sm:py-3 border-t border-[var(--border)] text-xs sm:text-sm print:hidden">
            <span className="text-[var(--muted)] text-center sm:text-left">
              Menampilkan {pageRows.length === 0 ? 0 : (pageClamped - 1) * PAGE_SIZE + 1}
              {"–"}
              {Math.min(pageClamped * PAGE_SIZE, sorted.length)} dari {formatQty(sorted.length)} barang
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                disabled={pageClamped <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Halaman sebelumnya"
                className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-md border border-[var(--border)] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[var(--muted)]"
              >
                <ChevronLeft size={14} />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>
              <span className="tabular text-[var(--muted)] px-1">
                {pageClamped} / {totalPages}
              </span>
              <button
                disabled={pageClamped >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Halaman berikutnya"
                className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-md border border-[var(--border)] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[var(--muted)]"
              >
                <span className="hidden sm:inline">Berikutnya</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        <footer className="text-center text-xs text-[var(--muted)] pb-4 flex flex-col items-center gap-3">
          <span>
            Data diproses dari SaldoStock.xls, SUPPLIER.xlsx &amp; KATEGORI_BARANG.xlsx &middot; dibuat{" "}
            {new Date(generatedAt).toLocaleString("id-ID")}
          </span>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[var(--border)] text-[var(--blue)] hover:bg-[var(--blue-soft)] hover:border-[var(--blue)] transition-colors print:hidden"
          >
            <ArrowUp size={14} /> Kembali ke Atas
          </button>
        </footer>
        </main>
      </div>

      <ScrollToTopButton />
    </div>
  );
}
