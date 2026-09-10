import { NextResponse, after } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSuspiciousReason } from "@/lib/moderation";
import { isPriorityEntrant } from "@/lib/priorityEntrants";
import { getPrizeRound, type PrizeRank } from "@/lib/prizeRounds";

export const runtime = "nodejs";

function randomFloat(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const PRIORITY_CHANCE = 0.1;

// 우선순위 대상자는 매 자리마다 10% 확률로 우선 배정하되, 당첨되지 않은 경우
// 나머지 일반 추첨 풀에도 그대로 남아 정상적인 당첨 기회를 유지합니다.
function pickWinnersWithPriority<T extends { department: string; name: string }>(
  pool: T[],
  count: number
): T[] {
  const remaining = shuffle(pool);
  const picked: T[] = [];

  while (picked.length < count && remaining.length > 0) {
    const priorityIndexes = remaining
      .map((entry, i) => (isPriorityEntrant(entry.department, entry.name) ? i : -1))
      .filter((i) => i >= 0);

    let index: number;
    if (priorityIndexes.length > 0 && randomFloat() < PRIORITY_CHANCE) {
      index = priorityIndexes[Math.floor(randomFloat() * priorityIndexes.length)];
    } else {
      index = Math.floor(randomFloat() * remaining.length);
    }

    picked.push(remaining[index]);
    remaining.splice(index, 1);
  }

  return picked;
}

type EligibleRow = { id: string; department: string; name: string; content: string };
type UpdatedRow = { id: string; department: string; name: string; content: string; prize_rank: number | null };

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const requestedCount = Math.floor(Number((body as { count?: unknown })?.count) || 1);
  const count = Math.min(Math.max(requestedCount, 1), 13);

  const requestedRank = Number((body as { rank?: unknown })?.rank);
  const rank = Number.isInteger(requestedRank) && requestedRank >= 1 && requestedRank <= 5 ? requestedRank : null;

  const supabase = createServiceRoleClient();
  const round = rank !== null ? getPrizeRound(rank as PrizeRank) : null;

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

  // 관리자 화면에서 "!" 의심 표시가 뜨는 접수(휴리스틱 판별)는 확인이 끝나기 전까지
  // 추첨 대상에서 제외합니다. AI 판별은 "작성카드보기 > 문제카드확인" 화면에서 미리
  // 걸러내는 용도로만 쓰고, 추첨 시점에는 실시간 AI 호출 없이 빠르게 진행합니다.
  const clean = eligible.filter((e) => getSuspiciousReason(e.content, e.name) === null);

  if (clean.length === 0) {
    return NextResponse.json(
      { error: "추첨 가능한 대상이 없습니다. 의심 표시(!)된 접수만 남아 있어 확인이 필요합니다." },
      { status: 400 }
    );
  }

  let updated: UpdatedRow[] = [];
  const order = new Map<string, number>();

  if (rank !== null && round) {
    // draw_winners RPC(schema.sql)가 등수별 advisory lock으로 "정원 확인 + 당첨 처리"를
    // 하나의 트랜잭션으로 원자적으로 처리하므로, 같은 등수에 요청이 동시에 여러 번
    // 들어와도(더블클릭 등) 정원을 절대 넘길 수 없습니다. 후보 중 일부가 그 사이
    // 다른 등수 추첨 등으로 이미 당첨돼 무효화된 경우를 대비해, 부족하면 남은
    // 후보 풀에서 더 뽑아 몇 차례 재시도해 정원을 채웁니다.
    const triedIds = new Set<string>();
    let remainingPool: EligibleRow[] = clean;

    for (let attempt = 0; attempt < 5 && updated.length < round.count && remainingPool.length > 0; attempt++) {
      const need = Math.min(round.count - updated.length, remainingPool.length);
      const picked = pickWinnersWithPriority(remainingPool, need);
      if (picked.length === 0) break;

      picked.forEach((p) => triedIds.add(p.id));
      remainingPool = remainingPool.filter((e) => !triedIds.has(e.id));

      const { data: rpcData, error: rpcError } = await supabase.rpc("draw_winners", {
        p_ids: picked.map((p) => p.id),
        p_rank: rank,
        p_max: round.count,
      });

      if (rpcError) {
        console.error("draw_winners rpc failed", rpcError);
        return NextResponse.json({ error: "당첨 처리에 실패했습니다. 다시 시도해 주세요." }, { status: 500 });
      }

      const newlyWon = (rpcData ?? []) as UpdatedRow[];
      for (const w of newlyWon) {
        if (!order.has(w.id)) order.set(w.id, order.size);
        updated.push(w);
      }

      // 이번 시도에서 하나도 새로 당첨되지 않았다면(이미 정원이 꽉 찬 상태) 더 시도할 필요가 없습니다.
      if (newlyWon.length === 0 && attempt > 0) break;
    }

    if (updated.length === 0) {
      return NextResponse.json(
        { error: `${round.label} 추첨은 이미 정원(${round.count}명)이 모두 채워졌습니다.` },
        { status: 400 }
      );
    }
  } else {
    // rank가 없는 호출(현재 앱에서는 쓰이지 않지만 과거 호출 형태 호환용)은
    // 정원 개념이 없으므로 기존 방식대로 단순 처리합니다.
    const picked = pickWinnersWithPriority(clean, Math.min(count, clean.length));
    const ids = picked.map((p) => p.id);
    ids.forEach((id, i) => order.set(id, i));

    const { data, error: updateError } = await supabase
      .from("entries")
      .update({ is_winner: true, won_at: new Date().toISOString(), prize_rank: null })
      .in("id", ids)
      .eq("is_winner", false)
      .select("id, department, name, content, prize_rank");

    if (updateError || !data || data.length === 0) {
      console.error("mark winner failed", updateError);
      return NextResponse.json({ error: "당첨 처리에 실패했습니다. 다시 시도해 주세요." }, { status: 500 });
    }
    updated = data;
  }

  // 리셋(초기화) 버튼을 눌러도 사라지지 않는 누적 당첨 기록을 별도로 남깁니다.
  // 이 기록 자체가 추첨 결과에 영향을 주지 않고 화면 전환 속도에도 영향을 주지 않도록,
  // 응답을 먼저 보낸 뒤 백그라운드에서 기록합니다. 실패해도 무시합니다.
  if (rank !== null) {
    after(async () => {
      const { error: historyError } = await supabase.from("winner_history").insert(
        updated.map((w) => ({ department: w.department, name: w.name, prize_rank: rank }))
      );
      if (historyError) {
        console.error("insert winner_history failed", historyError);
      }
    });
  }

  // 뽑힌 순서(피커 화면에서 보여줄 순서)를 유지합니다.
  const winners = [...updated].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return NextResponse.json({ winners });
}
