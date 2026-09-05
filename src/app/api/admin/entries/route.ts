import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { classifyOffTopic } from "@/lib/aiModeration";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("entries")
    .select("id, department, name, content, group_type, is_winner, won_at, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("list entries failed", error);
    return NextResponse.json({ error: "목록을 불러오지 못했습니다." }, { status: 500 });
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
