import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const apiKey = process.env.TYPECAST_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TYPECAST_API_KEY 환경변수가 설정되지 않았습니다." }, { status: 500 });
  }

  const res = await fetch("https://api.typecast.ai/v1/voices", {
    headers: { "X-API-KEY": apiKey },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    return NextResponse.json(
      { error: `타입캐스트 목소리 목록 조회에 실패했습니다 (${res.status}): ${errorText}` },
      { status: 502 }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
