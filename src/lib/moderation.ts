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

export function isSuspiciousEntry(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return true;

  const compact = trimmed.replace(/\s+/g, "");
  if (compact.length <= 5) return true;
  if (/^(.)\1{3,}$/u.test(compact)) return true;
  if (LAUGH_CRY_ONLY_PATTERN.test(trimmed)) return true;
  if (PLACEHOLDER_WORDS.has(compact.toLowerCase())) return true;

  return false;
}
