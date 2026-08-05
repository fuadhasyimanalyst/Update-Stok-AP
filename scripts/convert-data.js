#!/usr/bin/env node
/**
 * scripts/convert-data.js
 * ------------------------------------------------------------------
 * Membaca 3 file mentah dari folder /raw-data:
 *   - SUPPLIER.xlsx        (master supplier: PT -> kode SUPP)
 *   - KATEGORI_BARANG.xlsx (master kategori: Fast Moving / Slow Moving / DEAD)
 *   - SaldoStock.xls       (data stok mentah dari ERP, DIUPDATE SETIAP HARI)
 *
 * Lalu menggabungkannya (meniru rumus Excel di lib/processStock.js) dan
 * menyimpan hasilnya ke /data/processed.json, yang dibaca langsung oleh
 * halaman dashboard (app/page.js).
 *
 * Cara pakai setiap hari:
 *   1. Timpa file raw-data/SaldoStock.xls dengan hasil export ERP terbaru
 *      (nama file harus tetap "SaldoStock.xls").
 *   2. Jalankan: npm run convert-data
 *   3. Jalankan lokal: npm run dev  (atau: git commit + push -> auto build di Vercel,
 *      karena "npm run build" sudah otomatis menjalankan langkah ini juga)
 * ------------------------------------------------------------------
 */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { processStock } = require('../lib/processStock');

const RAW_DIR = path.join(__dirname, '..', 'raw-data');
const OUT_DIR = path.join(__dirname, '..', 'data');

function readSheet(filePath, sheetIndex = 0) {
  const wb = XLSX.readFile(filePath, { cellDates: false });
  const sheetName = wb.SheetNames[sheetIndex];
  const ws = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(ws, { defval: null, raw: true });
}

function main() {
  const supplierPath = path.join(RAW_DIR, 'SUPPLIER.xlsx');
  const kategoriPath = path.join(RAW_DIR, 'KATEGORI_BARANG.xlsx');
  const saldoPath = path.join(RAW_DIR, 'SaldoStock.xls');

  for (const p of [supplierPath, kategoriPath, saldoPath]) {
    if (!fs.existsSync(p)) {
      console.error(`[convert-data] File tidak ditemukan: ${p}`);
      process.exit(1);
    }
  }

  console.log('[convert-data] Membaca SUPPLIER.xlsx ...');
  const supplierRows = readSheet(supplierPath);

  console.log('[convert-data] Membaca KATEGORI_BARANG.xlsx ...');
  const kategoriRows = readSheet(kategoriPath);

  console.log('[convert-data] Membaca SaldoStock.xls ...');
  const saldoRows = readSheet(saldoPath);

  console.log(
    `[convert-data] Ditemukan: ${supplierRows.length} supplier, ${kategoriRows.length} baris kategori, ${saldoRows.length} baris saldo stok`
  );

  const result = processStock(saldoRows, supplierRows, kategoriRows);

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, 'processed.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');

  console.log(`[convert-data] Selesai. ${result.rows.length} baris stok ditulis ke ${outPath}`);
  console.log(`[convert-data] Data per tanggal: ${result.asOfDate || '(tidak terdeteksi)'}`);
}

main();
