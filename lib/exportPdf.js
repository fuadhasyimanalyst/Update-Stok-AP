"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Export baris stok (yang sedang tampil/terfilter) ke file PDF, landscape,
 * dengan header ringkas (judul, tanggal data, jumlah SKU & total qty) di atas
 * tabel. Kolom yang dimasukkan mengikuti `visibleColumns` supaya konsisten
 * dengan apa yang user lihat di layar.
 */
export function exportStockToPdf({ rows, columns, asOfDate, stats }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 32;

  // ---- Header dokumen ----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(30, 30, 34);
  doc.text("Update Stok — Laporan", margin, 36);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 118);
  const subtitle = `Data per: ${asOfDate || "—"}   ·   Dicetak: ${new Date().toLocaleString("id-ID")}`;
  doc.text(subtitle, margin, 52);

  const summary = `Total SKU: ${rows.length.toLocaleString("id-ID")}   ·   Total Qty: ${(stats?.totalQty ?? 0).toLocaleString("id-ID")}`;
  doc.text(summary, pageWidth - margin, 52, { align: "right" });

  // ---- Tabel ----
  const head = [columns.map((c) => c.label)];
  const body = rows.map((r) =>
    columns.map((c) => {
      const v = r[c.key];
      if (c.key === "QTY") return Number(v || 0).toLocaleString("id-ID");
      if (c.key === "KATEGORI") return v === "DEAD" ? "Dead Stock" : v || "-";
      if (c.key === "BARANG_PROMO") return v === "YA" ? "Promo" : "Non Promo";
      return v ?? "-";
    })
  );

  autoTable(doc, {
    head,
    body,
    startY: 64,
    margin: { left: margin, right: margin },
    styles: { font: "helvetica", fontSize: 8, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: [185, 28, 28], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [247, 247, 248] },
    columnStyles: columns.reduce((acc, c, i) => {
      if (c.numeric) acc[i] = { halign: "right" };
      return acc;
    }, {}),
    didDrawPage: () => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 155);
      doc.text(
        `Halaman ${doc.internal.getCurrentPageInfo().pageNumber} / ${pageCount}`,
        pageWidth - margin,
        doc.internal.pageSize.getHeight() - 14,
        { align: "right" }
      );
    },
  });

  doc.save(`update-stok${asOfDate ? "-" + asOfDate : ""}.pdf`);
}
