import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// 잘못 뽑힌 당첨자 한 명만 당첨 취소합니다(더블클릭 등으로 정원을 초과해 뽑힌 경우의
// 응급 수정용). 해당 접수를 다시 추첨 대상으로 되돌리고, 누적 기록(winner_history)에서도
// 같은 사람의 해당 등수 기록을 지웁니다.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const id = (body as { id?: unknown })?.id;
  if (typeof id !== "string" || id.length === 0) {
    return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: entry, error: fetchError } = await supabase
    .from("entries")
    .select("id, department, name, is_winner, prize_rank")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !entry) {
    console.error("fetch entry for revoke failed", fetchError);
    return NextResponse.json({ error: "해당 접수를 찾을 수 없습니다." }, { status: 404 });
  }
  if (!entry.is_winner) {
    return NextResponse.json({ error: "이미 당첨자가 아닙니다." }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("entries")
    .update({ is_winner: false, won_at: null, prize_rank: null })
    .eq("id", id);

  if (updateError) {
    console.error("revoke winner failed", updateError);
    return NextResponse.json({ error: "당첨 취소에 실패했습니다." }, { status: 500 });
  }

  if (entry.prize_rank !== null) {
    const { error: historyError } = await supabase
      .from("winner_history")
      .delete()
      .eq("department", entry.department)
      .eq("name", entry.name)
      .eq("prize_rank", entry.prize_rank);
    if (historyError) {
      console.error("delete winner_history for revoke failed", historyError);
    }
  }

  return NextResponse.json({ ok: true });
}
