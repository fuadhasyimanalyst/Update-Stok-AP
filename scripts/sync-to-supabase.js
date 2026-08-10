#!/usr/bin/env node
/**
 * scripts/sync-to-supabase.js
 * ------------------------------------------------------------------
 * Membaca 3 file mentah dari /raw-data (sama seperti convert-data.js lama),
 * memprosesnya lewat lib/processStock.js, lalu mengirim hasilnya sebagai
 * SNAPSHOT PENUH ke Supabase (tabel `stok` dikosongkan lalu diisi ulang).
 *
 * Cara pakai setiap kali ada update stok:
 *   1. Timpa raw-data/SaldoStock.xls dengan hasil export ERP terbaru
 *      (nama file harus tetap "SaldoStock.xls").
 *   2. Jalankan: npm run sync-to-supabase
 *
 * Membutuhkan file .env.local berisi:
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...   (JANGAN pernah commit ke git!)
 * ------------------------------------------------------------------
 */
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const { processStock } = require('../lib/processStock');

const RAW_DIR = path.join(__dirname, '..', 'raw-data');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error(
    '[sync] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diset di .env.local'
  );
  process.exit(1);
}

// Pakai service_role key di sini (bukan anon key) supaya bisa lewati RLS untuk insert/delete.
// Script ini HANYA dijalankan lokal/CI, tidak pernah dijalankan di browser.
const supabase = createClient(supabaseUrl, serviceKey);

function readSheet(filePath, sheetIndex = 0) {
  const wb = XLSX.readFile(filePath, { cellDates: false });
  const sheetName = wb.SheetNames[sheetIndex];
  const ws = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(ws, { defval: null, raw: true });
}

async function main() {
  const supplierPath = path.join(RAW_DIR, 'SUPPLIER.xlsx');
  const kategoriPath = path.join(RAW_DIR, 'KATEGORI_BARANG.xlsx');
  const saldoPath = path.join(RAW_DIR, 'SaldoStock.xls');

  for (const p of [supplierPath, kategoriPath, saldoPath]) {
    if (!fs.existsSync(p)) {
      console.error(`[sync] File tidak ditemukan: ${p}`);
      process.exit(1);
    }
  }

  console.log('[sync] Membaca file Excel...');
  const supplierRows = readSheet(supplierPath);
  const kategoriRows = readSheet(kategoriPath);
  const saldoRows = readSheet(saldoPath);

  const { rows, asOfDate, generatedAt } = processStock(saldoRows, supplierRows, kategoriRows);
  console.log(`[sync] ${rows.length} baris siap dikirim ke Supabase (data per ${asOfDate || '?'})`);

  console.log('[sync] Mengosongkan tabel stok lama...');
  const { error: delErr } = await supabase.from('stok').delete().gte('id', 0);
  if (delErr) throw delErr;

  const payload = rows.map((r) => ({
    kode_barang: r.KODE_BARANG,
    nama_barang: r.NAMA_BARANG,
    satuan: r.SATUAN,
    qty: r.QTY,
    gudang: r.GUDANG,
    depo: r.DEPO,
    cgrpdesc: r.CGRPDESC,
    supp: r.SUPP,
    kategori: r.KATEGORI,
    barang_promo: r.BARANG_PROMO,
    masuk_master: r.MASUK_MASTER,
  }));

  const CHUNK = 500;
  for (let i = 0; i < payload.length; i += CHUNK) {
    const chunk = payload.slice(i, i + CHUNK);
    const { error } = await supabase.from('stok').insert(chunk);
    if (error) throw error;
    console.log(`[sync] ${Math.min(i + CHUNK, payload.length)}/${payload.length} baris terkirim`);
  }

  console.log('[sync] Update metadata (as_of_date, generated_at)...');
  const { error: metaErr } = await supabase
    .from('stok_meta')
    .update({ as_of_date: asOfDate, generated_at: generatedAt })
    .eq('id', 1);
  if (metaErr) throw metaErr;

  console.log(`[sync] Selesai! Data per tanggal: ${asOfDate || '(tidak terdeteksi)'}`);

  // Opsional: minta Vercel hapus cache halaman "/" sekarang juga, supaya sales
  // langsung lihat data terbaru tanpa menunggu revalidate=3600 (1 jam) habis
  // sendiri. Kalau SITE_URL / REVALIDATE_SECRET tidak diset di .env.local,
  // langkah ini dilewati saja (cache tetap akan expire otomatis setelah 1 jam).
  const siteUrl = process.env.SITE_URL;
  const revalidateSecret = process.env.REVALIDATE_SECRET;
  if (siteUrl && revalidateSecret) {
    try {
      const res = await fetch(
        `${siteUrl.replace(/\/$/, '')}/api/revalidate?secret=${encodeURIComponent(revalidateSecret)}`,
        { method: 'POST' }
      );
      if (res.ok) {
        console.log('[sync] Cache halaman berhasil diperbarui (revalidate on-demand).');
      } else {
        console.warn(`[sync] Gagal memanggil endpoint revalidate (status ${res.status}), cache akan expire sendiri dalam 1 jam.`);
      }
    } catch (err) {
      console.warn(`[sync] Tidak bisa memanggil endpoint revalidate (${err.message}), cache akan expire sendiri dalam 1 jam.`);
    }
  } else {
    console.log('[sync] SITE_URL/REVALIDATE_SECRET belum diset — cache akan expire otomatis dalam 1 jam (lihat app/page.js).');
  }
}

main().catch((err) => {
  console.error('[sync] Gagal:', err.message);
  process.exit(1);
});
