import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// 문제카드(!)를 관리자가 확인한 뒤 정상카드로 되돌리거나(reviewedClean: true),
// 다시 문제카드로 되돌릴 때(false) 씁니다. reviewed_clean 컬럼이 아직 없는
// 환경(supabase/schema.sql의 alter table 미실행)에서는 42703 오류를 그대로
// 안내해, 관리자가 왜 안 되는지 알 수 있게 합니다.
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const reviewedClean = Boolean((body as { reviewedClean?: unknown })?.reviewedClean);

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("entries").update({ reviewed_clean: reviewedClean }).eq("id", id);

  if (error) {
    if (error.code === "42703" || /reviewed_clean/i.test(error.message ?? "")) {
      return NextResponse.json(
        { error: "정상카드 되돌리기 기능을 쓰려면 DB에 컬럼을 먼저 추가해야 합니다(supabase/schema.sql 참고)." },
        { status: 500 }
      );
    }
    console.error("update reviewed_clean failed", error);
    return NextResponse.json({ error: "처리에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("entries").delete().eq("id", id);

  if (error) {
    console.error("delete entry failed", error);
    return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
