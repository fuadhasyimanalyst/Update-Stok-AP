import "./globals.css";

// Font Google dimuat lewat <link> di <head> (bukan next/font) supaya proses
// `next build` tidak butuh koneksi internet sama sekali — fetch font terjadi
// di browser pengguna saat halaman dibuka, seperti website pada umumnya.

export const metadata = {
  title: "Update Stok | Dashboard Gudang",
  description:
    "Dashboard update stok multi-depo — fast moving, slow moving, dan dead stock.",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
