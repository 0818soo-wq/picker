import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// 리허설/테스트 목적으로 모든 당첨 기록을 초기화합니다. 실제 행사 중에는 사용하지 마세요.
export async function POST() {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("entries")
    .update({ is_winner: false, won_at: null })
    .eq("is_winner", true);

  if (error) {
    console.error("reset winners failed", error);
    return NextResponse.json({ error: "초기화에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
