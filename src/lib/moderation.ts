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

export type SuspiciousReason =
  | "empty"
  | "too_short"
  | "repeated_char"
  | "laugh_cry_only"
  | "placeholder_word";

export const SUSPICIOUS_REASON_LABELS: Record<SuspiciousReason, string> = {
  empty: "내용이 비어 있어요.",
  too_short: "내용이 너무 짧아요 (공백 제외 5자 이하).",
  repeated_char: "같은 글자만 반복해서 적었어요.",
  laugh_cry_only: "'ㅋㅋㅋ', 'ㅠㅠㅠ' 같은 표현만 적었어요.",
  placeholder_word: "'테스트', '없음' 같이 의미 없는 단어만 적었어요.",
};

// 의심되는 이유가 있으면 그 이유를, 없으면 null을 반환합니다.
export function getSuspiciousReason(content: string): SuspiciousReason | null {
  const trimmed = content.trim();
  if (!trimmed) return "empty";

  const compact = trimmed.replace(/\s+/g, "");
  if (compact.length <= 5) return "too_short";
  if (/^(.)\1{3,}$/u.test(compact)) return "repeated_char";
  if (LAUGH_CRY_ONLY_PATTERN.test(trimmed)) return "laugh_cry_only";
  if (PLACEHOLDER_WORDS.has(compact.toLowerCase())) return "placeholder_word";

  return null;
}

export function isSuspiciousEntry(content: string): boolean {
  return getSuspiciousReason(content) !== null;
}
