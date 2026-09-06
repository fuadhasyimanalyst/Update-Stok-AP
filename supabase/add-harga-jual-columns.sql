-- =========================================================
-- Migration: tambah kolom harga standar & harga jual (+PPN 11%)
-- Jalankan di: Supabase Dashboard > SQL Editor > New query
-- Aman dijalankan berkali-kali (pakai IF NOT EXISTS).
-- =========================================================

alter table public.stok
  add column if not exists nstdprice numeric,
  add column if not exists harga_jual numeric;

-- (Opsional) index kalau nanti mau filter/sort berdasarkan harga jual
create index if not exists stok_harga_jual_idx on public.stok (harga_jual);
