// AI(Claude)를 이용해 접수 내용이 행사 주제("조직의 변화, 어떠한 '축의 전환'이
// 필요할까요?")와 관련 있는 진지한 의견인지, 아니면 주제와 무관한 장난스러운
// 내용인지 판별합니다. 같은 접수를 반복해서 다시 판별하지 않도록 메모리에
// 캐시해둡니다(서버 재시작/재배포 시 초기화됨 — 행사 당일 짧은 기간 동안만
// 쓰는 용도라 문제되지 않습니다).

type AiModerationResult = {
  offTopic: boolean;
  reason: string | null;
};

const cache = new Map<string, AiModerationResult>();

const PROMPT_TEMPLATE = (content: string) => `다음은 사내 행사에서 "우리 조직의 새로운 축, 어떠한 '축의 전환'이 필요할까요?" 라는 질문에 대해 참석자가 작성한 응답입니다.

응답: "${content}"

이 응답이 조직의 변화나 발전 방향에 대한 진지한 의견(짧아도 괜찮음)인지, 아니면 질문과 전혀 관련 없는 장난스럽거나 무의미한 내용인지 판단해 주세요.
다른 설명 없이 아래 형식으로만 답하세요:
RELEVANT 또는 OFF_TOPIC
그다음 줄에 이유를 한 문장으로 적어주세요.`;

export async function classifyOffTopic(id: string, content: string): Promise<AiModerationResult> {
  const cached = cache.get(id);
  if (cached) return cached;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { offTopic: false, reason: null };
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 100,
        messages: [{ role: "user", content: PROMPT_TEMPLATE(content) }],
      }),
    });

    if (!res.ok) {
      console.error("[aiModeration] Claude API 호출 실패", res.status, await res.text().catch(() => ""));
      return { offTopic: false, reason: null };
    }

    const json = await res.json();
    const text = String(json?.content?.[0]?.text ?? "").trim();
    const offTopic = text.toUpperCase().startsWith("OFF_TOPIC");
    const reason = text.split("\n").slice(1).join(" ").trim() || null;

    const result: AiModerationResult = { offTopic, reason };
    cache.set(id, result);
    return result;
  } catch (err) {
    console.error("[aiModeration] 판별 중 오류", err);
    return { offTopic: false, reason: null };
  }
}
