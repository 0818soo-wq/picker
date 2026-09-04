import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

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
