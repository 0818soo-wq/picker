const TYPECAST_TTS_URL = "https://api.typecast.ai/v1/text-to-speech";

export async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  const apiKey = process.env.TYPECAST_API_KEY;
  const voiceId = process.env.TYPECAST_VOICE_ID;

  if (!apiKey || !voiceId) {
    throw new Error("TYPECAST_API_KEY / TYPECAST_VOICE_ID 환경변수가 설정되지 않았습니다.");
  }

  const res = await fetch(TYPECAST_TTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({
      voice_id: voiceId,
      text,
      model: "ssfm-v30",
      language: "kor",
      output: {
        audio_format: "wav",
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Typecast API 오류 (${res.status}): ${errorText}`);
  }

  return res.arrayBuffer();
}
