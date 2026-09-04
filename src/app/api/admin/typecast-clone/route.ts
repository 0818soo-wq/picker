import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const apiKey = process.env.TYPECAST_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TYPECAST_API_KEY 환경변수가 설정되지 않았습니다." }, { status: 500 });
  }

  let incoming: FormData;
  try {
    incoming = await req.formData();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const file = incoming.get("file");
  const name = String(incoming.get("name") ?? "사장님").slice(0, 30);

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "음성 샘플 파일이 필요합니다." }, { status: 400 });
  }
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "파일 용량은 25MB 이하여야 합니다." }, { status: 400 });
  }

  const upstreamForm = new FormData();
  upstreamForm.set("name", name);
  upstreamForm.set("model", "ssfm-v30");
  upstreamForm.set("file", file, file.name || "sample.mp3");

  const res = await fetch("https://api.typecast.ai/v1/voices/clone", {
    method: "POST",
    headers: { "X-API-KEY": apiKey },
    body: upstreamForm,
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: `타입캐스트 클로닝 요청 실패 (${res.status})`, detail: data },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, result: data });
}
