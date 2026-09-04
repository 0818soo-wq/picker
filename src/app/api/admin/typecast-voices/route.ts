import { NextResponse } from "next/server";

export const runtime = "nodejs";

type TypecastVoice = { voice_id?: string; voice_name?: string; voice_type?: string; [key: string]: unknown };

async function fetchVoices(apiKey: string, query: string): Promise<TypecastVoice[]> {
  const res = await fetch(`https://api.typecast.ai/v1/voices${query}`, {
    headers: { "X-API-KEY": apiKey },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => null);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.voices)) return data.voices;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export async function GET() {
  const apiKey = process.env.TYPECAST_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TYPECAST_API_KEY 환경변수가 설정되지 않았습니다." }, { status: 500 });
  }

  // voice_type 파라미터 이름이 정확히 무엇인지 문서상 불확실하여, 여러 후보로 동시에 조회한 뒤 합칩니다.
  const [plain, byVoiceType, byType, byModel] = await Promise.all([
    fetchVoices(apiKey, ""),
    fetchVoices(apiKey, "?voice_type=custom"),
    fetchVoices(apiKey, "?type=custom"),
    fetchVoices(apiKey, "?model=ssfm-v30"),
  ]);

  const merged = new Map<string, TypecastVoice>();
  for (const list of [plain, byVoiceType, byType, byModel]) {
    for (const voice of list) {
      const key = voice.voice_id ?? JSON.stringify(voice);
      merged.set(key, voice);
    }
  }

  const voices = Array.from(merged.values());
  const custom = voices.filter(
    (v) => v.voice_type === "custom" || (typeof v.voice_id === "string" && v.voice_id.startsWith("uc_"))
  );

  return NextResponse.json({
    total_count: voices.length,
    custom_count: custom.length,
    custom_voices: custom,
    all_voices: voices,
  });
}
