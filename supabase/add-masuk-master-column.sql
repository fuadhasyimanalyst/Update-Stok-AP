-- Migrasi: tambah kolom masuk_master ke tabel stok yang SUDAH ADA.
-- "create table if not exists" di schema.sql tidak akan menambah kolom baru
-- ke tabel yang sudah pernah dibuat sebelumnya — makanya perlu ALTER TABLE
-- terpisah ini. Jalankan SEKALI SAJA di: Supabase Dashboard > SQL Editor > New query.
--
-- Setelah ini dijalankan, jalankan ulang: npm run sync-to-supabase
-- supaya kolomnya terisi (sebelumnya field masuk_master tidak pernah dikirim
-- oleh sync-to-supabase.js, jadi baris lama nilainya NULL).

alter table public.stok
  add column if not exists masuk_master text;
