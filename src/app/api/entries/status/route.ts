import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// 접수 화면(공개)에서 지금 접수를 받고 있는지 확인하는 용도입니다. 로그인 없이도
// 호출되므로 Service Role로 서버에서 대신 조회해 open 여부만 돌려줍니다.
export async function GET() {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("app_settings")
    .select("entries_open")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("read app_settings failed", error);
    // 설정을 못 읽어도 접수 자체는 막지 않습니다.
    return NextResponse.json({ open: true });
  }

  return NextResponse.json({ open: data?.entries_open !== false });
}
