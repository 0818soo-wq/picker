import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { DUMMY_ENTRIES } from "@/lib/dummyEntries";

export const runtime = "nodejs";

// "더미데이터 추가" 버튼용입니다. 미리 저장해둔 고정 77개 테스트 카드
// (DUMMY_ENTRIES)를 그대로 채워 넣습니다. 실제 행사 데이터가 아니라
// 테스트/리허설 때만 눌러야 합니다. 이미 들어있는(소속+이름+유형이 같은)
// 카드는 건너뛰어서, 리셋 후 다시 눌러도 항상 같은 77개 구성이 됩니다.
export async function POST() {
  const supabase = createServiceRoleClient();

  const { data: existing, error: existingError } = await supabase
    .from("entries")
    .select("department, name, group_type");

  if (existingError) {
    console.error("read existing entries for seeding failed", existingError);
    return NextResponse.json({ error: "기존 접수 목록을 불러오지 못했습니다." }, { status: 500 });
  }

  const existingKeys = new Set((existing ?? []).map((e) => `${e.department}__${e.name}__${e.group_type}`));

  const rows = DUMMY_ENTRIES.filter(
    (e) => !existingKeys.has(`${e.department}__${e.name}__${e.group_type}`)
  );

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, added: 0 });
  }

  const { error: insertError } = await supabase.from("entries").insert(rows);

  if (insertError) {
    console.error("seed dummy entries failed", insertError);
    return NextResponse.json({ error: "더미데이터 추가에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, added: rows.length });
}
