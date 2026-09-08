import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// "작성카드 전체 삭제" - 접수된 카드(entries) 자체를 전부 지웁니다.
// 당첨 상태만 지우는 /api/admin/reset(초기화)과 달리 되돌릴 수 없는
// 완전 삭제이므로, 테스트/리허설 준비 용도로만 사용합니다.
export async function POST() {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("entries").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    console.error("reset all entries failed", error);
    return NextResponse.json({ error: "작성카드 전체 삭제에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
