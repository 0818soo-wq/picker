import { NextResponse } from "next/server";
import { resolveAttendeeByEmployeeId } from "@/lib/employeeDirectory";
import { titleSuffixFor } from "@/lib/attendees";

export const runtime = "nodejs";

// 접수 화면에서 사번으로 소속·이름을 조회하는 용도입니다. 사번 자체는
// 응답에 절대 포함하지 않고, 조회된 소속/이름만 돌려줍니다.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const employeeId = String((body as Record<string, unknown>)?.employeeId ?? "").trim();

  if (!employeeId) {
    return NextResponse.json({ error: "사번을 입력해 주세요." }, { status: 400 });
  }

  const attendee = resolveAttendeeByEmployeeId(employeeId);
  if (!attendee) {
    return NextResponse.json(
      { error: "사번을 다시 확인해주세요. 오타 여부를 확인 후 재입력해주세요." },
      { status: 404 }
    );
  }

  // 명단에는 있지만 참석 예정이 아닌 분도 의견 제출은 받되, 추첨 대상에서는
  // 제외됩니다. (실제 제외 처리는 접수 저장 시 서버에서 다시 판단합니다.)
  return NextResponse.json({
    department: attendee.department,
    name: attendee.name,
    titleSuffix: titleSuffixFor(attendee.title),
    eligible: attendee.attending,
  });
}
