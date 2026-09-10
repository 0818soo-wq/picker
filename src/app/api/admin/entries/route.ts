import { NextResponse, after } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { classifyOffTopic, getCachedClassification } from "@/lib/aiModeration";

export const runtime = "nodejs";

// 접수가 아무리 많아도(수백 건 이상) 목록 조회 자체가 외부 AI 판별을 기다리다
// 느려지거나 플랫폼의 함수 실행 시간 제한에 걸려 타임아웃 나지 않도록, 이미
// 캐시된 판별 결과만 즉시 붙여서 응답합니다. 아직 판별 안 된(캐시에 없는) 새
// 접수는 응답을 보낸 뒤 백그라운드에서 판별해 캐시에 채워두고, 다음 조회부터
// 반영됩니다.
const AI_CLASSIFY_CONCURRENCY = 10;

async function classifyInBackground(items: { id: string; content: string }[]) {
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      await classifyOffTopic(items[i].id, items[i].content);
    }
  }
  await Promise.all(Array.from({ length: Math.min(AI_CLASSIFY_CONCURRENCY, items.length) }, worker));
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

  const rows = data ?? [];
  const entries = rows.map((entry) => {
    const cached = getCachedClassification(entry.id);
    return { ...entry, ai_off_topic: cached?.offTopic ?? null, ai_reason: cached?.reason ?? null };
  });

  const uncached = rows.filter((r) => getCachedClassification(r.id) === undefined);
  if (uncached.length > 0) {
    after(() => classifyInBackground(uncached));
  }

  return NextResponse.json({ entries });
}
