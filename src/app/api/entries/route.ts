import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { findNameByEmployeeId } from "@/lib/employeeDirectory";
import { findAttendeeByName } from "@/lib/attendees";

export const runtime = "nodejs";

const GROUP_TYPES = new Set(["draw", "no_draw"]);
const MAX_CONTENT_LENGTH = 2000;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const employeeId = String((body as Record<string, unknown>).employeeId ?? "").trim();
  const content = String((body as Record<string, unknown>).content ?? "").trim();
  const groupType = String((body as Record<string, unknown>).groupType ?? "");

  if (!GROUP_TYPES.has(groupType)) {
    return NextResponse.json({ error: "잘못된 접수 유형입니다." }, { status: 400 });
  }
  if (!employeeId || !content) {
    return NextResponse.json({ error: "모든 항목을 입력해 주세요." }, { status: 400 });
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json(
      { error: `내용은 ${MAX_CONTENT_LENGTH}자 이하로 작성해 주세요.` },
      { status: 400 }
    );
  }

  // 소속/이름은 클라이언트가 보낸 값을 쓰지 않고, 사번으로 서버에서 다시
  // 조회한 값만 사용합니다. 사번 자체는 접수 데이터에 저장하지 않습니다.
  const name = findNameByEmployeeId(employeeId);
  if (!name) {
    return NextResponse.json({ error: "일치하는 사번을 찾을 수 없습니다." }, { status: 404 });
  }
  const attendee = findAttendeeByName(name);
  if (!attendee || !attendee.attending) {
    return NextResponse.json({ error: "참석 대상자 명단에서 확인되지 않습니다." }, { status: 404 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("entries").insert({
    department: attendee.department,
    name: attendee.name,
    content,
    group_type: groupType,
  });

  if (error) {
    console.error("entry insert failed", error);
    return NextResponse.json(
      { error: "접수 저장에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
