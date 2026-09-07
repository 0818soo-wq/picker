import { NextResponse } from "next/server";
import { resolveAttendeeByEmployeeId } from "@/lib/employeeDirectory";

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
  if (!attendee || !attendee.attending) {
    return NextResponse.json(
      { error: "참석 대상자가 아닙니다. 사번을 다시 확인해주세요." },
      { status: 404 }
    );
  }

  return NextResponse.json({ department: attendee.department, name: attendee.name });
}
