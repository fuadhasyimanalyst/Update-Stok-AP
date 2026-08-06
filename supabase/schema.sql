-- =========================================================
-- Update Stok Dashboard — Skema Supabase
-- Jalankan seluruh isi file ini di: Supabase Dashboard > SQL Editor > New query
-- =========================================================

-- Tabel utama: satu baris = satu SKU di satu gudang (snapshot terbaru)
create table if not exists public.stok (
  id bigint generated always as identity primary key,
  kode_barang text not null,
  nama_barang text not null,
  satuan text,
  qty numeric not null default 0,
  gudang text,
  depo text,
  cgrpdesc text,
  supp text,
  kategori text,
  barang_promo text,
  created_at timestamptz not null default now()
);

-- Index untuk mempercepat filter di dashboard (depo, kategori, gudang, supplier)
create index if not exists stok_depo_idx on public.stok (depo);
create index if not exists stok_kategori_idx on public.stok (kategori);
create index if not exists stok_gudang_idx on public.stok (gudang);
create index if not exists stok_supp_idx on public.stok (supp);
create index if not exists stok_nama_idx on public.stok using gin (to_tsvector('simple', nama_barang));

-- Tabel kecil untuk menyimpan "data per tanggal" & waktu generate terakhir
create table if not exists public.stok_meta (
  id int primary key default 1,
  as_of_date text,
  generated_at timestamptz,
  constraint stok_meta_single_row check (id = 1)
);
insert into public.stok_meta (id) values (1) on conflict (id) do nothing;

-- Aktifkan Row Level Security
alter table public.stok enable row level security;
alter table public.stok_meta enable row level security;

-- Izinkan siapa saja BACA (SELECT) — dashboard bersifat read-only untuk publik/anon key.
-- INSERT / UPDATE / DELETE hanya bisa lewat service_role key (dipakai script sync,
-- bukan dari browser), jadi tidak perlu policy tambahan untuk itu.
create policy "Public read stok" on public.stok
  for select using (true);

create policy "Public read stok_meta" on public.stok_meta
  for select using (true);
