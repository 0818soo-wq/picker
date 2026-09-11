import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { resolveAttendeeByEmployeeId } from "@/lib/employeeDirectory";
import { isDrawEligibleAttendee } from "@/lib/attendees";

export const runtime = "nodejs";

const GROUP_TYPES = new Set(["draw", "no_draw"]);
const MAX_CONTENT_LENGTH = 2000;
const MAX_MANUAL_FIELD_LENGTH = 30;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const employeeId = String((body as Record<string, unknown>).employeeId ?? "").trim();
  const content = String((body as Record<string, unknown>).content ?? "").trim();
  const groupType = String((body as Record<string, unknown>).groupType ?? "");
  const replaceExisting = Boolean((body as Record<string, unknown>).replaceExisting);
  const manualDepartment = String((body as Record<string, unknown>).manualDepartment ?? "")
    .trim()
    .slice(0, MAX_MANUAL_FIELD_LENGTH);
  const manualName = String((body as Record<string, unknown>).manualName ?? "")
    .trim()
    .slice(0, MAX_MANUAL_FIELD_LENGTH);

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

  const supabase = createServiceRoleClient();

  const { data: settings } = await supabase
    .from("app_settings")
    .select("entries_open")
    .eq("id", 1)
    .maybeSingle();

  if (settings?.entries_open === false) {
    return NextResponse.json({ error: "접수가 마감되었습니다. 감사합니다." }, { status: 403 });
  }

  // 명단에서 조회되는 경우, 소속/이름은 클라이언트가 보낸 값을 쓰지 않고
  // 사번으로 서버에서 다시 조회한 값만 사용합니다. 사번 자체는 접수
  // 데이터에 저장하지 않습니다.
  const attendee = resolveAttendeeByEmployeeId(employeeId);

  // 명단에 없는 사번은 화면에서 직접 입력한 소속/이름을 사용합니다. 신원이
  // 확실하지 않아 동일인 여부를 판단할 수 없으니 중복 확인은 건너뜁니다.
  if (!attendee && (!manualDepartment || !manualName)) {
    return NextResponse.json({ error: "소속과 이름을 입력해 주세요." }, { status: 400 });
  }
  const department = attendee ? attendee.department : manualDepartment;
  const name = attendee ? attendee.name : manualName;
  // 접수 링크는 하나로 통일되어 있으며, 어느 링크로 들어왔는지(폼이 보낸
  // groupType)와 무관하게 사번으로 조회한 실제 직책만으로 추첨 대상 여부를
  // 판단합니다. 지역단장/사업단장(및 참석 예정자)만 추첨(draw) 대상이고,
  // 파트장을 포함한 그 외 직책이나 명단에 없는 분은 의견 제출만 가능합니다.
  const effectiveGroupType = attendee?.attending && isDrawEligibleAttendee(attendee) ? "draw" : "no_draw";
  const skipDuplicateCheck = !attendee;

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
    // 위의 "기존 접수 확인" 쿼리와 이 저장 사이의 짧은 틈에 거의 동시에 두 번 접수(더블클릭,
    // 새로고침 후 재시도 등)가 들어오면 둘 다 "기존 접수 없음"으로 판단해 중복 저장을
    // 시도할 수 있습니다. entries_dedupe_idx(supabase/schema.sql) 유니크 인덱스가 DB에
    // 설치돼 있으면 이런 경우 두 번째 저장이 23505(유니크 제약 위반) 에러로 거부되므로,
    // 이를 "이미 접수함"으로 처리해 중복 저장을 확실하게 차단합니다.
    if (error.code === "23505") {
      return NextResponse.json({ duplicate: true }, { status: 409 });
    }
    console.error("entry insert failed", error);
    return NextResponse.json(
      { error: "접수 저장에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
