# Update Stok — Dashboard Gudang Multi-Depo

Dashboard web untuk memantau stok gudang di semua depo (Jepara, Semarang,
Pemalang, Purwokerto, Solo, Yogyakarta), lengkap dengan kategori **Fast
Moving / Slow Moving / Dead Stock**, filter per supplier, dan penanda
**Barang Promo**.

Aplikasi ini menggantikan proses manual copy-paste ke Excel
`Update_Stock_DD-MM-YYYY.xlsx` — semua rumus VLOOKUP/INDEX-MATCH yang dulu
ada di Excel sekarang dijalankan otomatis oleh script `scripts/convert-data.js`
(lihat penjelasan lengkap di `lib/processStock.js`).

## Struktur data

```
raw-data/
  SUPPLIER.xlsx         <- master supplier (kolom: PT, SUPP)
  KATEGORI_BARANG.xlsx  <- master kategori (kolom: DEPO, SUPP, NAMA BARANG, KATEGORI)
  SaldoStock.xls        <- data stok mentah dari ERP (DIUPDATE SETIAP HARI)
data/
  processed.json         <- hasil olahan (auto-generate, jangan edit manual)
lib/
  processStock.js         <- logika penggabungan data (setara rumus Excel)
scripts/
  convert-data.js          <- script yang membaca raw-data/* -> data/processed.json
components/                <- komponen React dashboard
app/                        <- halaman Next.js
```

### Kolom yang ditampilkan di tabel
`KODE BARANG`, `NAMA BARANG`, `SATUAN`, `QTY`, `GUDANG` (nama gudang asli
dari ERP), `DEPO` (hasil normalisasi — setara "DEPO 2" di Excel lama, gudang
showroom & gudang satelit Semarang sudah digabung ke depo induknya), `SUPP`
(kode supplier singkat hasil lookup dari `cgrpdesc`/nama PT ke master
SUPPLIER), `KATEGORI` (Fast Moving/Slow Moving/Dead Stock, hasil lookup ke
master KATEGORI_BARANG), dan `BARANG PROMO` (YA jika kode barang mengandung
`-00-`).

## Update data harian

Setiap hari, setelah Anda export ulang saldo stok dari ERP:

1. Timpa file `raw-data/SaldoStock.xls` dengan file export terbaru
   (**nama file harus tetap persis `SaldoStock.xls`**).
2. Jalankan:
   ```bash
   npm run convert-data
   ```
   Ini akan menulis ulang `data/processed.json`. Tanggal data ("Per Tgl.
   ...") terdeteksi otomatis dari file dan ditampilkan di header dashboard.
3. Commit & push ke GitHub:
   ```bash
   git add raw-data/SaldoStock.xls data/processed.json
   git commit -m "Update stok DD-MM-YYYY"
   git push
   ```
   Kalau repo ini tersambung ke Vercel, deploy baru akan berjalan otomatis
   (langkah `npm run build` sudah otomatis menjalankan `convert-data` lagi
   lewat hook `prebuild`, jadi push langsung dari file mentah pun aman).

Kalau ada supplier baru atau kategori barang berubah, cukup timpa
`raw-data/SUPPLIER.xlsx` atau `raw-data/KATEGORI_BARANG.xlsx` lalu ulangi
langkah yang sama.

## Menjalankan di lokal

Butuh Node.js 18+ (disarankan Node 20/22).

```bash
npm install
npm run dev
```

Buka http://localhost:3000. Saat `npm run dev` pertama kali dijalankan,
`data/processed.json` otomatis dibuat/diperbarui dari isi folder `raw-data/`
(lewat hook `predev`).

## Menyimpan ke GitHub

```bash
git init
git add .
git commit -m "Initial commit: dashboard update stok"
git branch -M main
git remote add origin <URL_REPO_GITHUB_ANDA>
git push -u origin main
```

File di `raw-data/` (termasuk `SaldoStock.xls`) dan `data/processed.json`
sengaja **ikut di-commit** sesuai kebutuhan Anda menyimpan data master &
data harian di GitHub. Jika suatu saat datanya dianggap terlalu besar/sensitif
untuk disimpan di repo publik, gunakan repo **private**, atau pindahkan ke
Supabase (lihat bagian di bawah) dan keluarkan `raw-data/` serta
`data/processed.json` dari git (tambahkan ke `.gitignore`).

## Deploy ke Vercel

1. Push project ini ke GitHub (lihat di atas).
2. Buka [vercel.com](https://vercel.com) → **Add New Project** → import
   repo GitHub ini.
3. Framework preset otomatis terdeteksi sebagai **Next.js** — tidak perlu
   ubah setting apa pun (build command `npm run build`, output otomatis).
4. Klik **Deploy**. Selesai — setiap kali Anda push perubahan
   `SaldoStock.xls` ke GitHub, Vercel akan build ulang otomatis dan
   dashboard ter-update.

## Rencana migrasi ke Supabase

Saat ini data disimpan sebagai file statis (`data/processed.json`) yang
dibaca langsung oleh halaman (`app/page.js`). Untuk migrasi ke Supabase
nanti, alurnya:

1. Buat tabel `stock_items` di Supabase dengan kolom yang sama seperti
   `processed.json` (`kode_barang`, `nama_barang`, `satuan`, `qty`,
   `gudang`, `depo`, `supp`, `kategori`, `barang_promo`), plus tabel
   `suppliers` dan `kategori_barang` untuk master data.
2. Ubah `scripts/convert-data.js` supaya, alih-alih menulis ke
   `data/processed.json`, ia melakukan upsert ke Supabase (pakai
   `@supabase/supabase-js`) — logika `lib/processStock.js` **tidak perlu
   diubah sama sekali**, karena bagian itu murni transformasi data.
3. Ubah `app/page.js` dari `import processed from "@/data/processed.json"`
   menjadi query ke Supabase (server component tetap bisa `await`
   langsung, atau via Route Handler `app/api/stock/route.js`).
4. Tambahkan env var `NEXT_PUBLIC_SUPABASE_URL` dan
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` di Vercel project settings.

Struktur project sekarang sudah dipisah rapi (`lib/` untuk logika,
`scripts/` untuk pipeline data, `components/` untuk UI) supaya migrasi ini
nanti tidak perlu bongkar UI sama sekali.

## Mengganti logo

Logo saat ini adalah placeholder monogram "AP" (`public/logo.svg`). Ganti
file tersebut dengan logo asli Anda (`Logo-AP.png` atau `.svg`), lalu update
referensinya di `app/layout.js` (bagian `icons`) dan `components/Dashboard.jsx`
(tag `<Image src="/logo.svg" .../>`) jika nama filenya berubah.
