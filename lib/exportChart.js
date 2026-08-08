"use client";

import { jsPDF } from "jspdf";

/**
 * Ambil "screenshot" sebuah elemen DOM (mis. kartu grafik) jadi <canvas>,
 * lalu dipakai untuk export JPG atau PDF. Pakai html2canvas-pro (bukan
 * html2canvas biasa) supaya warna CSS modern (oklch, dipakai Tailwind v4)
 * tetap ke-render dengan benar, tidak error.
 */
async function captureNode(node) {
  const { default: html2canvas } = await import("html2canvas-pro");
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const bg = isDark ? "#1c1d21" : "#ffffff";
  return html2canvas(node, {
    backgroundColor: bg,
    scale: Math.min(2, window.devicePixelRatio || 1.5),
    useCORS: true,
  });
}

function slugify(name) {
  return (name || "grafik").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function triggerDownload(dataUrl, filename) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** Download elemen grafik sebagai file JPG. */
export async function exportNodeAsJpg(node, name) {
  if (!node) return;
  const canvas = await captureNode(node);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
  triggerDownload(dataUrl, `${slugify(name)}.jpg`);
}

/** Download elemen grafik sebagai file PDF (satu gambar per halaman, orientasi mengikuti bentuk grafik). */
export async function exportNodeAsPdf(node, name) {
  if (!node) return;
  const canvas = await captureNode(node);
  const imgData = canvas.toDataURL("image/jpeg", 0.95);

  const orientation = canvas.width >= canvas.height ? "landscape" : "portrait";
  const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 24;

  const maxW = pageWidth - margin * 2;
  const maxH = pageHeight - margin * 2;
  const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
  const w = canvas.width * ratio;
  const h = canvas.height * ratio;
  const x = (pageWidth - w) / 2;
  const y = (pageHeight - h) / 2;

  doc.addImage(imgData, "JPEG", x, y, w, h);
  doc.save(`${slugify(name)}.pdf`);
}
