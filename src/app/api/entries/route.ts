import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { resolveAttendeeByEmployeeId } from "@/lib/employeeDirectory";

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
  const replaceExisting = Boolean((body as Record<string, unknown>).replaceExisting);

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
  const attendee = resolveAttendeeByEmployeeId(employeeId);

  // 명단에 아예 없는 사번이라도(재입력해도 못 찾는 경우) 의견 제출 자체는
  // 받아줍니다. 다만 누군지 알 수 없으므로 일반 표시로 저장하고, 신원이
  // 확실하지 않아 동일인 여부를 판단할 수 없으니 중복 확인은 건너뜁니다.
  const department = attendee ? attendee.department : "";
  const name = attendee ? attendee.name : "미확인 참석자";
  // 명단에는 있지만 참석 예정이 아니거나, 아예 명단에 없는 분은 폼과
  // 상관없이 추첨 대상에서는 제외(no_draw)되도록 저장합니다.
  const effectiveGroupType = attendee?.attending ? groupType : "no_draw";
  const skipDuplicateCheck = !attendee;

  const supabase = createServiceRoleClient();

  let existingId: string | null = null;

  if (!skipDuplicateCheck) {
    // 같은 사람이 이미 접수한 적이 있는지 확인합니다. (사번은 저장하지 않으므로
    // 서버가 조회한 소속/이름/접수 유형으로 동일인 여부를 판단합니다.)
    const { data: existing, error: existingError } = await supabase
      .from("entries")
      .select("id")
      .eq("department", department)
      .eq("name", name)
      .eq("group_type", effectiveGroupType)
      .maybeSingle();

    if (existingError) {
      console.error("check existing entry failed", existingError);
      return NextResponse.json({ error: "접수 확인 중 오류가 발생했습니다." }, { status: 500 });
    }
    existingId = existing?.id ?? null;
  }

  if (existingId && !replaceExisting) {
    return NextResponse.json({ duplicate: true }, { status: 409 });
  }

  if (existingId && replaceExisting) {
    const { error: deleteError } = await supabase.from("entries").delete().eq("id", existingId);
    if (deleteError) {
      console.error("delete existing entry failed", deleteError);
      return NextResponse.json({ error: "기존 접수를 삭제하지 못했습니다." }, { status: 500 });
    }
  }

  const { error } = await supabase.from("entries").insert({
    department,
    name,
    content,
    group_type: effectiveGroupType,
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
