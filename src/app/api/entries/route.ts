import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const GROUP_TYPES = new Set(["draw", "no_draw"]);
const MAX_FIELD_LENGTH = 100;
const MAX_CONTENT_LENGTH = 2000;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const department = String((body as Record<string, unknown>).department ?? "").trim();
  const name = String((body as Record<string, unknown>).name ?? "").trim();
  const content = String((body as Record<string, unknown>).content ?? "").trim();
  const groupType = String((body as Record<string, unknown>).groupType ?? "");

  if (!GROUP_TYPES.has(groupType)) {
    return NextResponse.json({ error: "잘못된 접수 유형입니다." }, { status: 400 });
  }
  if (!department || !name || !content) {
    return NextResponse.json({ error: "모든 항목을 입력해 주세요." }, { status: 400 });
  }
  if (department.length > MAX_FIELD_LENGTH || name.length > MAX_FIELD_LENGTH) {
    return NextResponse.json({ error: "입력값이 너무 깁니다." }, { status: 400 });
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json(
      { error: `내용은 ${MAX_CONTENT_LENGTH}자 이하로 작성해 주세요.` },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("entries").insert({
    department,
    name,
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
