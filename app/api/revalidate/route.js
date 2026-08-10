import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Endpoint OPSIONAL: dipanggil oleh scripts/sync-to-supabase.js setelah sync
 * selesai, supaya cache halaman ("/") langsung dianggap basi (revalidate on
 * demand), tanpa perlu menunggu sampai 1 jam (revalidate=3600 di app/page.js)
 * habis dengan sendirinya.
 *
 * Tetap aman untuk kuota: ini TIDAK menambah beban ke Supabase setiap
 * kunjungan sales — hanya menandai cache basi 1x setiap kali sync dijalankan
 * (1-2x/hari). Permintaan berikutnya dari sales akan memicu 1 kali fetch
 * segar ke Supabase, lalu di-cache lagi untuk 1 jam berikutnya.
 *
 * Cara pakai:
 *  1. Set env var REVALIDATE_SECRET di Vercel (Project Settings > Environment
 *     Variables) dan juga di .env.local (untuk dipakai oleh sync script).
 *  2. Set env var SITE_URL (mis. https://update-stok-ap.vercel.app) di
 *     .env.local, supaya sync script tahu ke mana harus memanggil endpoint
 *     ini setelah deploy.
 *  3. Kalau REVALIDATE_SECRET tidak diset, fitur ini otomatis dilewati
 *     (sync script tetap jalan normal, cache akan expire sendiri setelah
 *     1 jam seperti biasa) — jadi TIDAK WAJIB dipakai.
 */
export async function POST(request) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!process.env.REVALIDATE_SECRET) {
    return NextResponse.json(
      { revalidated: false, message: "REVALIDATE_SECRET belum diset di server, endpoint ini nonaktif." },
      { status: 501 }
    );
  }

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ revalidated: false, message: "Secret salah." }, { status: 401 });
  }

  revalidatePath("/");
  return NextResponse.json({ revalidated: true, now: Date.now() });
}
