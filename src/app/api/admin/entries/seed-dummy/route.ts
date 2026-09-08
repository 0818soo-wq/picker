import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { ATTENDEES, isDrawEligibleTitle } from "@/lib/attendees";

export const runtime = "nodejs";

const DEFAULT_COUNT = 30;
const MAX_COUNT = 100;

// 작동 테스트용으로 실제 명단(ATTENDEES)에서 아직 접수하지 않은 사람들을
// 골라 더미 접수 카드를 채워 넣습니다. 실제 행사 데이터가 아니라 테스트/
// 리허설 때만 눌러야 합니다.
const SAMPLE_CONTENTS = [
  "변화하는 상황에 맞춰 팀별 소통 채널을 좀 더 자주 여는 게 필요하다고 생각합니다.",
  "성과에 대한 인정과 보상 체계가 좀 더 명확해지면 좋겠습니다.",
  "신규 인력 온보딩 프로세스를 표준화하면 조직 적응이 빨라질 것 같습니다.",
  "부서 간 협업 시 정보 공유가 늦어지는 경우가 많아 개선이 필요합니다.",
  "현장의 목소리를 반영할 수 있는 정기 소통 자리가 더 늘어났으면 합니다.",
  "디지털 전환에 맞춰 반복 업무를 자동화하는 방향으로 가면 좋겠습니다.",
  "신입 직원 교육 프로그램을 조금 더 실무 중심으로 개편했으면 합니다.",
  "고객 접점에서의 피드백이 본사까지 빠르게 전달되는 체계가 필요합니다.",
  "워라밸을 지키면서도 성과를 낼 수 있는 유연한 근무 환경이 필요합니다.",
  "지역 조직과 본사 간 정보 격차를 줄이는 노력이 계속됐으면 좋겠습니다.",
  "테스트",
  "잘 부탁드립니다",
];

function pickContent(seed: number): string {
  return SAMPLE_CONTENTS[seed % SAMPLE_CONTENTS.length];
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const requested = Number((body as { count?: unknown })?.count);
  const count = Math.min(MAX_COUNT, Math.max(1, Number.isFinite(requested) ? requested : DEFAULT_COUNT));

  const supabase = createServiceRoleClient();

  const { data: existing, error: existingError } = await supabase
    .from("entries")
    .select("department, name, group_type");

  if (existingError) {
    console.error("read existing entries for seeding failed", existingError);
    return NextResponse.json({ error: "기존 접수 목록을 불러오지 못했습니다." }, { status: 500 });
  }

  const existingKeys = new Set((existing ?? []).map((e) => `${e.department}__${e.name}__${e.group_type}`));

  const candidates = ATTENDEES.filter((a) => a.attending && isDrawEligibleTitle(a.title)).filter((a) => {
    const groupType = a.title === "파트장" || a.title === "지원파트장" ? "no_draw" : "draw";
    return !existingKeys.has(`${a.department}__${a.name}__${groupType}`);
  });

  // 매번 다른 조합이 뽑히도록 섞습니다.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const picked = candidates.slice(0, count);

  if (picked.length === 0) {
    return NextResponse.json({ error: "추가할 수 있는 더미 후보가 없습니다. (명단 인원이 이미 모두 접수됨)" }, { status: 400 });
  }

  const rows = picked.map((a, i) => ({
    department: a.department,
    name: a.name,
    content: pickContent(i),
    group_type: a.title === "파트장" || a.title === "지원파트장" ? "no_draw" : "draw",
  }));

  const { error: insertError } = await supabase.from("entries").insert(rows);

  if (insertError) {
    console.error("seed dummy entries failed", insertError);
    return NextResponse.json({ error: "더미데이터 추가에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, added: rows.length });
}
