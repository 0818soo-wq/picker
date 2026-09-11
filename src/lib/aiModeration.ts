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

// 네트워크 호출 없이 캐시에 이미 판별 결과가 있는지만 확인합니다. 목록 조회
// API가 AI 응답을 기다리지 않고 즉시 응답할 수 있도록 하는 용도입니다.
export function getCachedClassification(id: string): AiModerationResult | undefined {
  return cache.get(id);
}

const MAX_REASON_LENGTH = 20;

const PROMPT_TEMPLATE = (content: string) => `다음은 사내 행사에서 "우리 조직의 새로운 축, 어떠한 '축의 전환'이 필요할까요?" 라는 질문에 대해 참석자가 작성한 응답입니다.

응답: "${content}"

이 응답이 조직의 변화나 발전 방향에 대한 진지한 의견(짧아도 괜찮음, 다소 막연하거나 의례적인 덕담이어도 괜찮음)인지, 아니면 질문과 전혀 관련 없는 장난스럽거나 무의미한 내용인지 판단해 주세요.
애매하면 RELEVANT로 판단하세요. 조금이라도 진지하게 쓴 것 같으면 무조건 RELEVANT입니다.
다른 설명 없이 아래 형식으로만 답하세요:
RELEVANT 또는 OFF_TOPIC
그다음 줄에 이유를 ${MAX_REASON_LENGTH}자 이내의 아주 짧은 구절로만 적어주세요. 완전한 문장이나 마침표 없이, 라벨처럼 짧게 (예: "주제와 무관한 잡담", "진지함이 없는 내용").`;

function truncateReason(reason: string): string {
  if (reason.length <= MAX_REASON_LENGTH) return reason;
  return `${reason.slice(0, MAX_REASON_LENGTH - 1)}…`;
}

export async function classifyOffTopic(id: string, content: string): Promise<AiModerationResult> {
  const cached = cache.get(id);
  if (cached) return cached;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { offTopic: false, reason: null };
  }

  try {
    // 외부 API가 응답 없이 멈추면 목록 조회 전체가 무한정 대기하게 되므로,
    // 일정 시간(8초) 안에 응답이 없으면 실패로 간주하고 넘어갑니다.
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 60,
        messages: [{ role: "user", content: PROMPT_TEMPLATE(content) }],
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error("[aiModeration] Claude API 호출 실패", res.status, await res.text().catch(() => ""));
      // 크레딧 부족처럼 재시도해도 계속 실패하는 오류를 캐시 없이 두면, 화면을
      // 새로고침할 때마다 미판별 카드 전부에 대해 다시 API를 호출하게 됩니다.
      // 실패도 캐시해 불필요한 반복 호출을 막습니다(서버가 재배포되면 캐시가
      // 초기화되어, 이후엔 다시 시도됩니다).
      const result: AiModerationResult = { offTopic: false, reason: null };
      cache.set(id, result);
      return result;
    }

    const json = await res.json();
    const text = String(json?.content?.[0]?.text ?? "").trim();
    const offTopic = text.toUpperCase().startsWith("OFF_TOPIC");
    const rawReason = text.split("\n").slice(1).join(" ").trim();
    const reason = rawReason ? truncateReason(rawReason) : null;

    const result: AiModerationResult = { offTopic, reason };
    cache.set(id, result);
    return result;
  } catch (err) {
    console.error("[aiModeration] 판별 중 오류", err);
    const result: AiModerationResult = { offTopic: false, reason: null };
    cache.set(id, result);
    return result;
  }
}
