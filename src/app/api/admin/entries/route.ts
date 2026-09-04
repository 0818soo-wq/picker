import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("entries")
    .select("id, department, name, content, group_type, is_winner, won_at, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("list entries failed", error);
    return NextResponse.json({ error: "목록을 불러오지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({ entries: data });
}
