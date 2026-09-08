import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSuspiciousReason } from "@/lib/moderation";
import { classifyOffTopic } from "@/lib/aiModeration";

export const runtime = "nodejs";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const requestedCount = Math.floor(Number((body as { count?: unknown })?.count) || 1);
  const count = Math.min(Math.max(requestedCount, 1), 12);

  const requestedRank = Number((body as { rank?: unknown })?.rank);
  const rank = Number.isInteger(requestedRank) && requestedRank >= 1 && requestedRank <= 5 ? requestedRank : null;

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

  // 관리자 화면에서 "!" 의심 표시가 뜨는 접수(휴리스틱 또는 AI 판별)는
  // 확인이 끝나기 전까지 추첨 대상에서 제외합니다.
  const heuristicClean = eligible.filter((e) => getSuspiciousReason(e.content, e.name) === null);
  const aiChecked = await Promise.all(
    heuristicClean.map(async (e) => ({ entry: e, offTopic: (await classifyOffTopic(e.id, e.content)).offTopic }))
  );
  const clean = aiChecked.filter((c) => !c.offTopic).map((c) => c.entry);

  if (clean.length === 0) {
    return NextResponse.json(
      { error: "추첨 가능한 대상이 없습니다. 의심 표시(!)된 접수만 남아 있어 확인이 필요합니다." },
      { status: 400 }
    );
  }

  const picked = shuffle(clean).slice(0, Math.min(count, clean.length));
  const ids = picked.map((p) => p.id);

  const { data: updated, error: updateError } = await supabase
    .from("entries")
    .update({ is_winner: true, won_at: new Date().toISOString(), prize_rank: rank })
    .in("id", ids)
    .eq("is_winner", false)
    .select("id, department, name, content, prize_rank");

  if (updateError || !updated || updated.length === 0) {
    console.error("mark winner failed", updateError);
    return NextResponse.json({ error: "당첨 처리에 실패했습니다. 다시 시도해 주세요." }, { status: 500 });
  }

  // 리셋(초기화) 버튼을 눌러도 사라지지 않는 누적 당첨 기록을 별도로 남깁니다.
  // 이 기록 자체가 추첨 결과에 영향을 주지는 않으므로 실패해도 무시합니다.
  if (rank !== null) {
    const { error: historyError } = await supabase.from("winner_history").insert(
      updated.map((w) => ({ department: w.department, name: w.name, prize_rank: rank }))
    );
    if (historyError) {
      console.error("insert winner_history failed", historyError);
    }
  }

  // 뽑힌 순서(피커 화면에서 보여줄 순서)를 유지합니다.
  const order = new Map(ids.map((id, i) => [id, i]));
  const winners = [...updated].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return NextResponse.json({ winners });
}
