import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { classifyOffTopic } from "@/lib/aiModeration";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("entries")
    .select("id, department, name, content, group_type, is_winner, won_at, prize_rank, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("list entries failed", error);
    // TODO: 원인 파악이 끝나면 error.message 노출은 다시 제거합니다.
    return NextResponse.json(
      { error: "목록을 불러오지 못했습니다.", detail: error.message, hint: error.hint ?? null, code: error.code ?? null },
      { status: 500 }
    );
  }

  // AI로 주제 관련성을 판별해 각 접수에 덧붙입니다. 이미 판별한 접수는
  // 캐시에서 즉시 반환되므로, 실제로 API를 호출하는 건 새 접수뿐입니다.
  const entries = await Promise.all(
    (data ?? []).map(async (entry) => {
      const ai = await classifyOffTopic(entry.id, entry.content);
      return { ...entry, ai_off_topic: ai.offTopic, ai_reason: ai.reason };
    })
  );

  return NextResponse.json({ entries });
}
