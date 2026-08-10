import Dashboard from "@/components/Dashboard";
import { createClient } from "@supabase/supabase-js";

// Cache halaman selama 4 jam (14.400 detik).
//
// Disesuaikan dengan jadwal sync manual: 08:00, 12:00, 16:00 — jarak antar
// sync konsisten 4 jam, jadi data memang tidak berubah dalam rentang itu.
// Tidak perlu cache lebih pendek dari ini, karena Supabase tetap akan diakses
// ulang padahal isinya belum berubah sama sekali.
//
// Angka 4 jam ini hanya JARING PENGAMAN (fallback) — begitu Anda menjalankan
// `npm run sync-to-supabase`, endpoint /api/revalidate (lihat file itu untuk
// cara mengaktifkannya lewat SITE_URL & REVALIDATE_SECRET di .env.local) akan
// langsung menghapus cache saat itu juga, jadi sales tetap lihat data baru
// dalam hitungan detik setelah tiap sync jam 08:00/12:00/16:00 — bukan
// menunggu sampai 4 jam berikutnya.
export const revalidate = 14400;

async function getStokData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Supabase membatasi maksimal ~1000 baris per request secara default,
  // jadi kita ambil data per-halaman (pagination) sampai benar-benar habis,
  // supaya tidak bergantung pada setting "Max Rows" di dashboard Supabase.
  const PAGE_SIZE = 1000;
  let rows = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("stok")
      .select(
        "id, kode_barang, nama_barang, satuan, qty, gudang, depo, cgrpdesc, supp, kategori, barang_promo, masuk_master"
      )
      .order("nama_barang", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Gagal mengambil data stok dari Supabase: ${error.message}`);
    }
    if (!data || data.length === 0) break;

    rows = rows.concat(data);
    if (data.length < PAGE_SIZE) break; // halaman terakhir
    from += PAGE_SIZE;
  }

  const { data: meta } = await supabase
    .from("stok_meta")
    .select("as_of_date, generated_at")
    .eq("id", 1)
    .single();

  const mapped = rows.map((r) => ({
    id: r.id,
    KODE_BARANG: r.kode_barang,
    NAMA_BARANG: r.nama_barang,
    SATUAN: r.satuan,
    QTY: Number(r.qty) || 0,
    GUDANG: r.gudang,
    DEPO: r.depo,
    CGRPDESC: r.cgrpdesc,
    SUPP: r.supp,
    KATEGORI: r.kategori,
    BARANG_PROMO: r.barang_promo,
    MASUK_MASTER: r.masuk_master,
  }));

  return {
    rows: mapped,
    asOfDate: meta?.as_of_date ?? null,
    generatedAt: meta?.generated_at ?? new Date().toISOString(),
  };
}

export default async function Home() {
  const { rows, asOfDate, generatedAt } = await getStokData();
  return <Dashboard rows={rows} asOfDate={asOfDate} generatedAt={generatedAt} />;
}
