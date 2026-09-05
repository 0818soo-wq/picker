// 장난 또는 잘못 접수된 것으로 의심되는 내용을 걸러내기 위한 간단한 휴리스틱입니다.
// 완벽한 판별은 불가능하므로 관리자가 눈으로 다시 확인할 수 있도록 표시만 해줍니다.

const LAUGH_CRY_ONLY_PATTERN = /^[ㅋㅎㅠㅜㄷㅗ!?.,~\s]+$/u;

const PLACEHOLDER_WORDS = new Set([
  "test",
  "테스트",
  "없음",
  "패스",
  "pass",
  "몰라요",
  "몰라",
  "asdf",
  "asdfasdf",
  "ㅁㄴㅇㄹ",
  "ㅁㄴㅇㄹㅁㄴㅇㄹ",
  "1234",
  "12345",
  "가나다라",
  "가나다라마바사",
]);

// 행사 주제(조직 변화 관련 의견)와 무관하게 자주 나오는 장난성 문구입니다.
// 정확히 이 문구만 적은 경우에만 걸리도록 짧은 완성형 문장 위주로 구성했습니다.
const OFF_TOPIC_PHRASES = new Set([
  "집에가고싶다",
  "집에가고싶어요",
  "집에가고싶어",
  "퇴근하고싶다",
  "퇴근하고싶어요",
  "퇴근하고싶어",
  "배고파요",
  "배고프다",
  "배고파",
  "졸려요",
  "졸리다",
  "졸려",
  "심심해요",
  "심심하다",
  "심심해",
  "힘들어요",
  "힘들다",
  "힘들어",
  "귀찮아요",
  "귀찮다",
  "귀찮아",
  "빨리끝내고싶다",
  "빨리끝났으면좋겠다",
  "빨리끝났으면좋겠어요",
]);

export type SuspiciousReason =
  | "empty"
  | "too_short"
  | "repeated_char"
  | "laugh_cry_only"
  | "placeholder_word"
  | "off_topic";

export const SUSPICIOUS_REASON_LABELS: Record<SuspiciousReason, string> = {
  empty: "내용이 비어 있어요.",
  too_short: "내용이 너무 짧아요 (공백 제외 5자 이하).",
  repeated_char: "같은 글자나 짧은 패턴만 반복해서 적었어요.",
  laugh_cry_only: "'ㅋㅋㅋ', 'ㅠㅠㅠ' 같은 표현만 적었어요.",
  placeholder_word: "'테스트', '없음' 같이 의미 없는 단어만 적었어요.",
  off_topic: "주제와 상관없는 장난성 문구예요.",
};

// "샘플샘플샘플..."처럼 1~6글자짜리 짧은 패턴이 문자열 전체를 채울 만큼
// 반복되는지 확인합니다. 단순 반복 문자("ㅋㅋㅋㅋ")도 패턴 길이 1로 잡힙니다.
function hasRepeatingPattern(compact: string): boolean {
  const maxPatternLen = Math.min(6, Math.floor(compact.length / 3));
  for (let len = 1; len <= maxPatternLen; len++) {
    const pattern = compact.slice(0, len);
    const repeatCount = Math.ceil(compact.length / len);
    if (pattern.repeat(repeatCount).slice(0, compact.length) === compact) return true;
  }
  return false;
}

// 의심되는 이유가 있으면 그 이유를, 없으면 null을 반환합니다.
export function getSuspiciousReason(content: string): SuspiciousReason | null {
  const trimmed = content.trim();
  if (!trimmed) return "empty";

  const compact = trimmed.replace(/\s+/g, "");
  if (compact.length <= 5) return "too_short";
  if (hasRepeatingPattern(compact)) return "repeated_char";
  if (LAUGH_CRY_ONLY_PATTERN.test(trimmed)) return "laugh_cry_only";
  if (PLACEHOLDER_WORDS.has(compact.toLowerCase())) return "placeholder_word";
  if (OFF_TOPIC_PHRASES.has(compact.toLowerCase())) return "off_topic";

  return null;
}

export function isSuspiciousEntry(content: string): boolean {
  return getSuspiciousReason(content) !== null;
}
