import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

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
  const count = Math.min(Math.max(requestedCount, 1), 8);

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

  const picked = shuffle(eligible).slice(0, Math.min(count, eligible.length));
  const ids = picked.map((p) => p.id);

  const { data: updated, error: updateError } = await supabase
    .from("entries")
    .update({ is_winner: true, won_at: new Date().toISOString() })
    .in("id", ids)
    .eq("is_winner", false)
    .select("id, department, name, content");

  if (updateError || !updated || updated.length === 0) {
    console.error("mark winner failed", updateError);
    return NextResponse.json({ error: "당첨 처리에 실패했습니다. 다시 시도해 주세요." }, { status: 500 });
  }

  // 뽑힌 순서(피커 화면에서 보여줄 순서)를 유지합니다.
  const order = new Map(ids.map((id, i) => [id, i]));
  const winners = [...updated].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return NextResponse.json({ winners });
}
