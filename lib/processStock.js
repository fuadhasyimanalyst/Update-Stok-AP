/**
 * processStock.js
 * ------------------------------------------------------------------
 * Meniru logika yang ada di file Excel "Update_Stock_DD-MM-YYYY.xlsx"
 * (sheet "SaldoStock" / Table1) agar bisa dijalankan otomatis di luar Excel.
 *
 * Alur logika asli di Excel:
 *   SUPP   = VLOOKUP(cgrpdesc, SUPP!A:B, 2, 0)
 *            -> cgrpdesc (nama PT dari ERP) dicocokkan ke master SUPPLIER
 *               (kolom PT -> kolom SUPP) untuk dapat kode supplier singkat.
 *   GUDANG = cwhsdesc (nama gudang mentah dari ERP)
 *   DEPO   = IF(GUDANG="DIAMOND" OR GUDANG="BLOK J", "SEMARANG", GUDANG)
 *   DEPO2  = VLOOKUP(DEPO, tabel_depo, 2, 0)
 *            -> menggabungkan varian showroom (JEPARA-SHOWROOM -> JEPARA, dst)
 *            -> INI YANG DITAMPILKAN SEBAGAI "DEPO" DI DASHBOARD
 *   KEY    = DEPO2 & "_" & NAMA BARANG
 *   KATEGORI = INDEX/MATCH(KEY, master KATEGORI_BARANG) -> Fast/Slow/Dead
 *   BARANG PROMO = IF kode barang mengandung "-00-" -> "YA" else "TIDAK"
 *   HARGA JUAL = ROUND(HARGA_LIST * 1.11, 0)
 *            -> HARGA_LIST diambil dari master DAFTAR_HARGA.xlsx (kolom "ALL PRODUK" & "HARGA"),
 *               dicocokkan by NAMA BARANG, lalu ditambah PPN 11% dan dibulatkan ke rupiah terdekat.
 *               nstdprice (harga standar ERP) TIDAK dipakai lagi sebagai dasar harga jual —
 *               hanya dipakai sebagai fallback kalau nama barangnya belum ada di DAFTAR_HARGA.xlsx,
 *               dan field HARGA_SUMBER menandai mana yang dipakai ("DAFTAR_HARGA" / "FALLBACK_ERP").
 *   NILAI STOK = HARGA JUAL * QTY
 *            -> dipakai untuk melihat depo mana yang "overstock" (nilai stok tertahan
 *               paling besar), bukan cuma dari sisi jumlah unit (QTY) saja.
 *   MASUK_MASTER = "YA" jika NAMA BARANG sudah pernah tercatat di master KATEGORI_BARANG
 *                  (di depo manapun), "TIDAK" jika nama barangnya sama sekali baru.
 *                  Dipakai untuk page "Belum Masuk Master" -> khusus barang yang BENAR-BENAR
 *                  baru, bukan sekadar kombinasi depo+barang yang masternya belum lengkap
 *                  (SaldoStock update harian, master KATEGORI_BARANG update berkala).
 * ------------------------------------------------------------------
 */

// Tarif PPN yang ditambahkan ke nstdprice untuk mendapatkan harga jual.
const PPN_RATE = 0.11;

// Tabel normalisasi GUDANG -> DEPO (langkah 1, gabungkan gudang satelit Semarang)
const GUDANG_KE_DEPO_SEMARANG = new Set(['DIAMOND', 'BLOK J']);

// Tabel normalisasi DEPO -> DEPO 2 (langkah 2, gabungkan varian showroom)
// Sesuai range $AT$1:$AU$9 pada sheet SaldoStock di file Excel aslinya.
const DEPO_KE_DEPO2 = {
  SEMARANG: 'SEMARANG',
  JEPARA: 'JEPARA',
  PEMALANG: 'PEMALANG',
  PURWOKERTO: 'PURWOKERTO',
  SOLO: 'SOLO',
  YOGYAKARTA: 'YOGYAKARTA',
  'JEPARA-SHOWROOM': 'JEPARA',
  'PURWOKERTO-SHOWROOM': 'PURWOKERTO',
};

function normalizeDepo(gudangMentah) {
  const gudang = (gudangMentah || '').trim().toUpperCase();
  const depo = GUDANG_KE_DEPO_SEMARANG.has(gudang) ? 'SEMARANG' : gudang;
  // Jika depo belum dikenal di tabel, pakai apa adanya (fallback, bukan #N/A seperti Excel)
  return DEPO_KE_DEPO2[depo] || depo;
}

/**
 * @param {Array<Object>} saldoRows - hasil parse SaldoStock.xls (field ERP asli)
 * @param {Array<{PT:string, SUPP:string}>} supplierRows - master SUPPLIER.xlsx
 * @param {Array<{DEPO:string, SUPP:string, 'NAMA BARANG':string, KATEGORI:string}>} kategoriRows - master KATEGORI_BARANG.xlsx
 * @param {Array<{'ALL PRODUK':string, HARGA:number}>} [hargaListRows] - master DAFTAR_HARGA.xlsx (opsional,
 *        kalau tidak diisi maka semua baris fallback ke nstdprice*1.11 seperti sebelumnya)
 * @returns {{ rows: Array<Object>, asOfDate: string|null, generatedAt: string }}
 */
function processStock(saldoRows, supplierRows, kategoriRows, hargaListRows = []) {
  // Bangun peta lookup PT -> SUPP (setara VLOOKUP(cgrpdesc, SUPP!A:B, 2, 0))
  const supplierMap = new Map();
  for (const s of supplierRows) {
    if (s.PT) supplierMap.set(String(s.PT).trim(), String(s.SUPP || '').trim());
  }

  // Bangun peta lookup "DEPO_NAMA BARANG" -> KATEGORI
  // (setara INDEX/MATCH terhadap kolom "DEPO & NAMA BARANG" di master KATEGORI BARANG)
  const kategoriMap = new Map();
  // Set nama barang saja (lintas semua depo) -> dipakai untuk deteksi "barang benar-benar baru".
  // Beda dengan kategoriMap: SaldoStock diupdate HARIAN sedangkan master KATEGORI_BARANG cuma
  // diupdate berkala (bulanan/3 bulanan), jadi wajar ada kombinasi depo+barang yang belum ada di
  // master padahal barangnya sendiri sudah dikenal (sudah pernah dicatat di depo lain). Kombinasi
  // seperti ini TIDAK dianggap "barang baru", cukup fallback kategori Slow Moving seperti biasa.
  const namaMasterSet = new Set();
  for (const k of kategoriRows) {
    const depo = String(k.DEPO || '').trim().toUpperCase();
    const nama = String(k['NAMA BARANG'] || '').trim();
    const key = `${depo}_${nama}`;
    kategoriMap.set(key, k.KATEGORI || 'Slow Moving');
    if (nama) namaMasterSet.add(nama);
  }

  // Bangun peta lookup NAMA BARANG (dinormalisasi) -> harga dari DAFTAR_HARGA.xlsx.
  // Ini yang jadi dasar HARGA JUAL, BUKAN nstdprice dari SaldoStock.
  const hargaListMap = new Map();
  for (const h of hargaListRows) {
    const nama = String(h['ALL PRODUK'] || '').trim().toUpperCase();
    const harga = Number(h.HARGA);
    if (nama && !Number.isNaN(harga) && harga > 0) hargaListMap.set(nama, harga);
  }

  let asOfDate = null;

  const rows = saldoRows
    // baris tanpa kode/nama barang adalah baris kosong sisa export ERP -> dibuang
    .filter((r) => r.cstdcode && r.cstkdesc)
    .map((r, idx) => {
      const namaBarang = String(r.cstkdesc || '').trim();
      const kodeBarang = String(r.cstdcode || '').trim();
      const satuan = String(r.cunidesc || '').trim();
      const qty = Number(r.ntqty) || 0;
      const gudang = String(r.cwhsdesc || '').trim();
      const cgrpdesc = String(r.cgrpdesc || '').trim();
      const depo = normalizeDepo(gudang);

      const supp = supplierMap.get(cgrpdesc) || cgrpdesc || 'LAIN2';

      const kategoriKey = `${depo}_${namaBarang}`;
      // "Belum masuk master" = nama barangnya sama sekali belum pernah tercatat di master
      // KATEGORI_BARANG, di depo manapun. Kalau namanya sudah dikenal (cuma kombinasi
      // depo+barang ini yang belum ada), itu bukan barang baru -> tetap fallback Slow Moving,
      // tetap tampil di page normal (Non Promo/Promo/dst), bukan di page "Belum Masuk Master".
      const masukMaster = namaMasterSet.has(namaBarang);
      // Barang yang belum ada di master KATEGORI_BARANG dianggap Slow Moving (bukan "-")
      const kategori = kategoriMap.get(kategoriKey) || 'Slow Moving';

      const barangPromo = kodeBarang.includes('-00-') ? 'YA' : 'TIDAK';

      const nstdprice = Number(r.nstdprice) || 0;

      // Harga jual = harga dari DAFTAR_HARGA.xlsx (by NAMA BARANG) + PPN 11%, dibulatkan ke rupiah.
      // Kalau nama barangnya belum ada di DAFTAR_HARGA.xlsx, fallback ke harga standar ERP
      // supaya tidak ada baris yang harga jualnya 0, tapi ditandai lewat HARGA_SUMBER.
      const hargaList = hargaListMap.get(namaBarang.toUpperCase());
      const hargaDasar = hargaList != null ? hargaList : nstdprice;
      const hargaSumber = hargaList != null ? 'DAFTAR_HARGA' : 'FALLBACK_ERP';
      const hargaJual = Math.round(hargaDasar * (1 + PPN_RATE));
      const nilaiStok = hargaJual * qty;

      if (!asOfDate && r.judul) {
        const match = String(r.judul).match(/(\d{2}-\d{2}-\d{4})/);
        if (match) asOfDate = match[1];
      }

      return {
        id: idx,
        KODE_BARANG: kodeBarang,
        NAMA_BARANG: namaBarang,
        SATUAN: satuan,
        QTY: qty,
        GUDANG: gudang,
        DEPO: depo,
        CGRPDESC: cgrpdesc,
        SUPP: supp,
        KATEGORI: kategori,
        BARANG_PROMO: barangPromo,
        NSTDPRICE: nstdprice,
        HARGA_JUAL: hargaJual,
        HARGA_SUMBER: hargaSumber,
        NILAI_STOK: nilaiStok,
        // "TIDAK" = nama barang ini sama sekali belum pernah tercatat di master
        // KATEGORI_BARANG.xlsx (di depo manapun) -> kemungkinan besar barang baru.
        MASUK_MASTER: masukMaster ? 'YA' : 'TIDAK',
      };
    });

  return { rows, asOfDate, generatedAt: new Date().toISOString() };
}

module.exports = { processStock, normalizeDepo };
