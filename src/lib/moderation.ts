// 장난 또는 잘못 접수된 것으로 의심되는 내용을 걸러내기 위한 간단한 휴리스틱입니다.
// 완벽한 판별은 불가능하므로 관리자가 눈으로 다시 확인할 수 있도록 표시만 해줍니다.

import { findAttendeeByName } from "@/lib/attendees";
import { stripLeaderTitle } from "@/lib/format";

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
  | "off_topic"
  | "question_restated"
  | "not_attendee";

export const SUSPICIOUS_REASON_LABELS: Record<SuspiciousReason, string> = {
  empty: "내용 없음",
  too_short: "내용이 너무 짧음",
  repeated_char: "같은 글자만 반복",
  laugh_cry_only: "'ㅋㅋㅋ' 같은 표현만 입력",
  placeholder_word: "의미 없는 단어만 입력",
  off_topic: "주제와 무관한 문구",
  question_restated: "질문 문구를 그대로 입력함",
  not_attendee: "명단에 없는 이름",
};

// 참석자 명단에 있고 참석 예정으로 표시된 사람인지 확인합니다.
function isKnownAttendee(name: string): boolean {
  const cleaned = stripLeaderTitle(name);
  if (!cleaned) return false;
  const record = findAttendeeByName(cleaned);
  return !!record && record.attending;
}

// "샘플샘플샘플..."처럼 1~6글자짜리 짧은 패턴이 문자열 전체를 채울 만큼
// 반복되는지 확인합니다. 단순 반복 문자("ㅋㅋㅋㅋ")도 패턴 길이 1로 잡히고,
// "테스트테스트"처럼 짧은 단어가 정확히 2번만 반복된 경우도 잡습니다.
function hasRepeatingPattern(compact: string): boolean {
  const maxPatternLen = Math.min(6, Math.floor(compact.length / 2));
  for (let len = 1; len <= maxPatternLen; len++) {
    const pattern = compact.slice(0, len);
    const repeatCount = Math.ceil(compact.length / len);
    if (pattern.repeat(repeatCount).slice(0, compact.length) === compact) return true;
  }
  return false;
}

// PLACEHOLDER_WORDS에 있는 단어가 내용 전체가 아니라 일부로 2번 이상 붙어
// 나오는 경우도 잡습니다. 예: "거제통영 김홍배 테스트테스트"처럼 다른 글자와
// 섞여 있어 hasRepeatingPattern으로는 못 잡는 경우를 보완합니다.
function containsRepeatedPlaceholder(compact: string): boolean {
  const lower = compact.toLowerCase();
  for (const word of PLACEHOLDER_WORDS) {
    if (word.length < 2) continue;
    if (lower.includes(word.repeat(2))) return true;
  }
  return false;
}

// 반복은 안 됐지만 "작성테스트 완료"처럼 짧은 내용 속에 명백한 테스트/키보드매싱성
// 단어가 1번만 섞여 있는 경우도 잡습니다. "없음", "몰라" 같은 단어는 실제 짧은
// 의견에도 자연스럽게 등장할 수 있어(예: "차별 없음이 필요해요") 제외하고, 진짜
// 의견에는 나올 일이 거의 없는 명백한 단어만 부분일치로 확인합니다.
const UNAMBIGUOUS_PLACEHOLDER_WORDS = ["test", "테스트", "패스", "pass", "asdf", "ㅁㄴㅇㄹ"];
const SHORT_PLACEHOLDER_MAX_LENGTH = 15;

function containsPlaceholderInShortContent(compact: string): boolean {
  if (compact.length > SHORT_PLACEHOLDER_MAX_LENGTH) return false;
  const lower = compact.toLowerCase();
  return UNAMBIGUOUS_PLACEHOLDER_WORDS.some((word) => lower.includes(word));
}

// 접수 화면(EventBanner.tsx 기본 문구)에 그대로 떠 있는 질문을 실제 의견 대신
// 그대로 베껴 쓴 경우를 잡습니다. 문장 자체는 문법적으로 멀쩡해서 다른 휴리스틱으로는
// 못 잡습니다. 공백/따옴표/문장부호를 지운 뒤 비교해 줄바꿈이나 일부만 복사해도 잡습니다.
const EVENT_QUESTION_RAW =
  "우리 조직의 새로운 축, 어떠한 '축의 전환'이 필요할까요? 변화하는 환경 속에서 우리 조직이 나아가야 할 방향을 함께 고민해주세요.";

function normalizeForQuestionMatch(text: string): string {
  return text.toLowerCase().replace(/[\s'’‘"“”.,!?]/g, "");
}

const EVENT_QUESTION_NORMALIZED = normalizeForQuestionMatch(EVENT_QUESTION_RAW);
const QUESTION_RESTATED_MIN_LENGTH = 15;

function isEventQuestionRestated(trimmed: string): boolean {
  const normalized = normalizeForQuestionMatch(trimmed);
  if (normalized.length < QUESTION_RESTATED_MIN_LENGTH) return false;
  return (
    EVENT_QUESTION_NORMALIZED.includes(normalized) || normalized.includes(EVENT_QUESTION_NORMALIZED)
  );
}

// 의심되는 이유가 있으면 그 이유를, 없으면 null을 반환합니다.
// name을 함께 넘기면 참석자 명단에 없는 이름인지도 확인합니다.
export function getSuspiciousReason(content: string, name?: string): SuspiciousReason | null {
  const trimmed = content.trim();
  if (!trimmed) return "empty";

  const compact = trimmed.replace(/\s+/g, "");
  if (compact.length <= 5) return "too_short";
  if (hasRepeatingPattern(compact)) return "repeated_char";
  if (containsRepeatedPlaceholder(compact)) return "placeholder_word";
  if (LAUGH_CRY_ONLY_PATTERN.test(trimmed)) return "laugh_cry_only";
  if (PLACEHOLDER_WORDS.has(compact.toLowerCase())) return "placeholder_word";
  if (containsPlaceholderInShortContent(compact)) return "placeholder_word";
  if (isEventQuestionRestated(trimmed)) return "question_restated";
  if (OFF_TOPIC_PHRASES.has(compact.toLowerCase())) return "off_topic";
  if (name && !isKnownAttendee(name)) return "not_attendee";

  return null;
}

export function isSuspiciousEntry(content: string, name?: string): boolean {
  return getSuspiciousReason(content, name) !== null;
}
