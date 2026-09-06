-- =========================================================
-- Migration: tambah kolom harga_sumber & nilai_stok
-- Latar belakang: harga jual sekarang diambil dari master DAFTAR_HARGA.xlsx
-- (bukan lagi dari nstdprice/SaldoStock), lalu dikali qty jadi nilai_stok,
-- supaya bisa lihat depo mana yang overstock dari sisi nilai rupiah.
-- Jalankan di: Supabase Dashboard > SQL Editor > New query
-- Aman dijalankan berkali-kali (pakai IF NOT EXISTS).
-- =========================================================

alter table public.stok
  add column if not exists harga_sumber text,   -- 'DAFTAR_HARGA' atau 'FALLBACK_ERP'
  add column if not exists nilai_stok numeric;   -- qty * harga_jual

-- (Opsional) index kalau nanti mau filter/sort berdasarkan nilai stok
create index if not exists stok_nilai_stok_idx on public.stok (nilai_stok);
