import { NextResponse } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "./lib/session";

// Path yang TIDAK perlu login:
// - /login, /api/login       -> halaman & endpoint login itu sendiri
// - /api/revalidate          -> dipanggil oleh scripts/sync-to-supabase.js
//                                (bukan dari browser), sudah punya proteksi
//                                sendiri lewat REVALIDATE_SECRET
const PUBLIC_PATHS = ["/login", "/api/login", "/api/revalidate"];

function isPublicPath(pathname) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Next.js 16: konvensi "middleware.js" sudah deprecated, diganti "proxy.js"
// (fungsi & perilakunya sama persis, cuma nama file/export-nya beda).
// Lihat: https://nextjs.org/docs/messages/middleware-to-proxy
export default async function proxy(request) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const secret = process.env.SESSION_SECRET;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const valid = await verifySessionToken(token, secret);

  if (!valid) {
    const loginUrl = new URL("/login", request.url);
    // Supaya setelah login berhasil, user dibalikin ke halaman yang tadi dituju.
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Proxy jalan untuk semua path KECUALI file statis Next.js (_next/*) dan
// aset publik (gambar, favicon, dll) — file-file itu tidak mengandung data
// rahasia, jadi tidak perlu dicek login (dan supaya halaman login sendiri
// tetap bisa memuat logo/CSS-nya).
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
