import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = createServiceRoleClient();

  const { data: eligible, error } = await supabase
    .from("entries")
    .select("id, department, name, content")
    .eq("group_type", "draw")
    .eq("is_winner", false);

  if (error) {
    console.error("fetch eligible entries failed", error);
    return NextResponse.json({ error: "추첨 대상을 불러오지 못했습니다." }, { status: 500 });
  }
  if (!eligible || eligible.length === 0) {
    return NextResponse.json({ error: "추첨할 대상이 없습니다." }, { status: 400 });
  }

  const winnerIndex = crypto.getRandomValues(new Uint32Array(1))[0] % eligible.length;
  const winner = eligible[winnerIndex];

  const { data: updated, error: updateError } = await supabase
    .from("entries")
    .update({ is_winner: true, won_at: new Date().toISOString() })
    .eq("id", winner.id)
    .eq("is_winner", false)
    .select("id, department, name, content")
    .maybeSingle();

  if (updateError || !updated) {
    console.error("mark winner failed", updateError);
    return NextResponse.json({ error: "당첨 처리에 실패했습니다. 다시 시도해 주세요." }, { status: 500 });
  }

  return NextResponse.json({ winner: updated });
}
