/**
 * lib/session.js
 * ------------------------------------------------------------------
 * Login sederhana: satu username/password bersama (disimpan di env var
 * DASHBOARD_USERNAME / DASHBOARD_PASSWORD), TANPA tabel user di database.
 *
 * Begitu login berhasil, server memberi cookie berisi token yang
 * ditandatangani (HMAC-SHA256) pakai SESSION_SECRET, supaya orang tidak bisa
 * sekadar mengarang isi cookie sendiri untuk melewati login (beda dengan
 * cookie polos seperti "loggedin=true" yang gampang dipalsukan).
 *
 * Dipakai dari 2 tempat:
 *  - middleware.js (Edge runtime)      -> verifySessionToken()
 *  - app/api/login/route.js (Node.js)  -> createSessionToken()
 * Keduanya pakai Web Crypto API (globalThis.crypto.subtle) supaya kompatibel
 * di kedua runtime tanpa kode terpisah.
 * ------------------------------------------------------------------
 */

export const COOKIE_NAME = "update_stok_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 hari

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return toHex(sig);
}

/** Buat token session baru. secret wajib diisi (dari process.env.SESSION_SECRET). */
export async function createSessionToken(secret, maxAgeSeconds = SESSION_MAX_AGE_SECONDS) {
  const payload = JSON.stringify({ exp: Date.now() + maxAgeSeconds * 1000 });
  const payloadB64 = btoa(payload);
  const sig = await hmacHex(secret, payloadB64);
  return `${payloadB64}.${sig}`;
}

/** Cek token session valid (tanda tangan cocok & belum kedaluwarsa). */
export async function verifySessionToken(token, secret) {
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sig] = parts;

  const expectedSig = await hmacHex(secret, payloadB64);
  if (expectedSig !== sig) return false;

  try {
    const payload = JSON.parse(atob(payloadB64));
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}
