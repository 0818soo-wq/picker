import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { classifyOffTopic } from "@/lib/aiModeration";

export const runtime = "nodejs";

// 재배포 직후처럼 캐시가 비어있는 상태에서 접수가 수백 건 쌓여 있으면, 한꺼번에
// 수백 개의 AI 판별 요청이 동시에 나가 외부 API 레이트리밋에 걸리거나 응답이
// 느려질 수 있습니다. 동시 실행 개수를 제한해 안전하게 처리합니다.
const AI_CLASSIFY_CONCURRENCY = 10;

async function classifyAll<T extends { id: string; content: string }>(items: T[]) {
  const results: { ai_off_topic: boolean; ai_reason: string | null }[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const i = next++;
      const ai = await classifyOffTopic(items[i].id, items[i].content);
      results[i] = { ai_off_topic: ai.offTopic, ai_reason: ai.reason };
    }
  }

  await Promise.all(Array.from({ length: Math.min(AI_CLASSIFY_CONCURRENCY, items.length) }, worker));
  return results;
}

export async function GET() {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("entries")
    .select("id, department, name, content, group_type, is_winner, won_at, prize_rank, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("list entries failed", error);
    return NextResponse.json({ error: "목록을 불러오지 못했습니다." }, { status: 500 });
  }

  // AI로 주제 관련성을 판별해 각 접수에 덧붙입니다. 이미 판별한 접수는
  // 캐시에서 즉시 반환되므로, 실제로 API를 호출하는 건 새 접수뿐입니다.
  const rows = data ?? [];
  const aiResults = await classifyAll(rows);
  const entries = rows.map((entry, i) => ({ ...entry, ...aiResults[i] }));

  return NextResponse.json({ entries });
}
