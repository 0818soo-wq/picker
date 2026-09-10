import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { resolveAttendeeByEmployeeId } from "@/lib/employeeDirectory";
import { isLeaderTitle } from "@/lib/attendees";

export const runtime = "nodejs";

const GROUP_TYPES = new Set(["draw", "no_draw"]);

// "내가 접수한 내용 수정하기" 화면에서 사번으로 기존에 작성한 내용을 불러올 때 씁니다.
// 사번 자체는 응답에 포함하지 않습니다.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const employeeId = String((body as Record<string, unknown>)?.employeeId ?? "").trim();
  const groupType = String((body as Record<string, unknown>)?.groupType ?? "");

  if (!employeeId) {
    return NextResponse.json({ error: "사번을 입력해 주세요." }, { status: 400 });
  }
  if (!GROUP_TYPES.has(groupType)) {
    return NextResponse.json({ error: "잘못된 접수 유형입니다." }, { status: 400 });
  }

  const attendee = resolveAttendeeByEmployeeId(employeeId);
  if (!attendee) {
    return NextResponse.json({ content: null });
  }

  // /api/entries의 저장 로직과 동일하게, 실제 직책(명단 기준)만으로 판단합니다.
  const effectiveGroupType = attendee.attending && isLeaderTitle(attendee.title) ? "draw" : "no_draw";

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("entries")
    .select("content")
    .eq("department", attendee.department)
    .eq("name", attendee.name)
    .eq("group_type", effectiveGroupType)
    .maybeSingle();

  if (error) {
    console.error("lookup my entry failed", error);
    return NextResponse.json({ error: "기존 접수 내용을 불러오지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({ content: data?.content ?? null });
}
