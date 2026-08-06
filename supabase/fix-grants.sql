-- Perbaikan: berikan izin dasar (GRANT) ke role anon & authenticated.
-- RLS policy yang sudah dibuat sebelumnya tetap berlaku sebagai lapisan
-- keamanan tambahan (membatasi hanya boleh SELECT), tapi tanpa GRANT ini
-- Postgres akan menolak akses sebelum RLS sempat dicek sama sekali.

grant usage on schema public to anon, authenticated;

grant select on public.stok to anon, authenticated;
grant select on public.stok_meta to anon, authenticated;

-- service_role dipakai oleh script sync-to-supabase.js (butuh insert/delete/update)
grant all privileges on public.stok to service_role;
grant all privileges on public.stok_meta to service_role;
