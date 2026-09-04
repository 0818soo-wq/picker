import { NextResponse } from "next/server";
import { ADMIN_COOKIE_MAX_AGE, ADMIN_COOKIE_NAME, createAdminSessionToken, timingSafeEqual } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const passcode = body?.passcode;

  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) {
    return NextResponse.json({ error: "서버에 관리자 비밀번호가 설정되지 않았습니다." }, { status: 500 });
  }

  if (typeof passcode !== "string" || passcode.length === 0 || !timingSafeEqual(passcode, expected)) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const token = await createAdminSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });
  return res;
}
