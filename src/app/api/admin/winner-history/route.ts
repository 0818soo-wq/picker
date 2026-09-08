import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// "과거당첨기록보기" 화면용입니다. entries가 리셋되어도 winner_history는
// 별도로 계속 쌓이므로, 지금까지 진행된 모든 추첨(초기화 이전 포함) 결과를 보여줍니다.
export async function GET() {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("winner_history")
    .select("id, department, name, prize_rank, won_at")
    .order("won_at", { ascending: false });

  if (error) {
    console.error("list winner_history failed", error);
    return NextResponse.json({ error: "과거 당첨 기록을 불러오지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({ history: data ?? [] });
}
