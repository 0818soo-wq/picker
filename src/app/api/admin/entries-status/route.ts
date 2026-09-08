import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// "접수중단하기" 토글의 관리자용 조회/변경 API입니다. /draw/:path*, /api/admin/:path*는
// proxy.ts에서 관리자 로그인 여부를 이미 확인하므로 여기서는 별도 인증을 하지 않습니다.
export async function GET() {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("app_settings")
    .select("entries_open")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("read app_settings failed", error);
    return NextResponse.json({ error: "접수 상태를 불러오지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({ open: data?.entries_open !== false });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const open = Boolean((body as Record<string, unknown>)?.open);

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ id: 1, entries_open: open });

  if (error) {
    console.error("update app_settings failed", error);
    return NextResponse.json({ error: "접수 상태를 변경하지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, open });
}
