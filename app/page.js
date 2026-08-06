import Dashboard from "@/components/Dashboard";
import { createClient } from "@supabase/supabase-js";

// Selalu ambil data terbaru dari Supabase, jangan di-cache statis oleh Next.js
export const revalidate = 0;

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
      .select("*")
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
