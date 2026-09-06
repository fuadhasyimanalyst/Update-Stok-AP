import { NextResponse } from "next/server";
import { COOKIE_NAME, SESSION_MAX_AGE_SECONDS, createSessionToken } from "@/lib/session";

export async function POST(request) {
  const { username, password } = await request.json().catch(() => ({}));

  const expectedUsername = process.env.DASHBOARD_USERNAME;
  const expectedPassword = process.env.DASHBOARD_PASSWORD;
  const secret = process.env.SESSION_SECRET;

  if (!expectedUsername || !expectedPassword || !secret) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Login belum dikonfigurasi di server (DASHBOARD_USERNAME / DASHBOARD_PASSWORD / SESSION_SECRET belum diset).",
      },
      { status: 501 }
    );
  }

  const valid = username === expectedUsername && password === expectedPassword;

  if (!valid) {
    return NextResponse.json({ ok: false, message: "Username atau password salah." }, { status: 401 });
  }

  const token = await createSessionToken(secret);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
