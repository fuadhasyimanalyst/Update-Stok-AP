import "./globals.css";

// Font Google dimuat lewat <link> di <head> (bukan next/font) supaya proses
// `next build` tidak butuh koneksi internet sama sekali — fetch font terjadi
// di browser pengguna saat halaman dibuka, seperti website pada umumnya.

export const metadata = {
  title: "Update Stok | Dashboard Gudang",
  description:
    "Dashboard update stok multi-depo — fast moving, slow moving, dan dead stock.",
  icons: {
    icon: "/logo-api.webp",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Set tema (siang/malam) sebelum halaman dirender, supaya tidak "kedip"
            putih dulu baru berubah gelap saat reload di mode malam. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('update-stok-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
