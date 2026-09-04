import { NextResponse } from "next/server";
import { synthesizeSpeech } from "@/lib/typecast";

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 300;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const text = String((body as { text?: unknown })?.text ?? "").trim();

  if (!text) {
    return NextResponse.json({ error: "text가 필요합니다." }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: "텍스트가 너무 깁니다." }, { status: 400 });
  }

  try {
    const audio = await synthesizeSpeech(text);
    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("typecast synth failed", error);
    return NextResponse.json({ error: "음성 생성에 실패했습니다." }, { status: 500 });
  }
}
