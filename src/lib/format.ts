import { findAttendeeByName, titleSuffixFor } from "@/lib/attendees";

const TITLE_SUFFIX_PATTERN = /(파트장님|파트장|단장님|단장)$/u;

// 이름 입력란에 실수로 "OOO단장", "OOO파트장님"처럼 직책을 함께 적은 경우,
// 발표 문구에서 "단장님단장님"처럼 중복되지 않도록 끝의 직책 표현을 제거합니다.
export function stripLeaderTitle(name: string): string {
  return name.trim().replace(TITLE_SUFFIX_PATTERN, "").trim();
}

const DEPARTMENT_SUFFIXES = ["지역단", "영업단", "사업단", "FP센터", "센터"];

function hasDepartmentSuffix(department: string): boolean {
  return DEPARTMENT_SUFFIXES.some((suffix) => department.endsWith(suffix));
}

export type ResolvedWinner = {
  department: string;
  name: string;
  titleSuffix: "단장님" | "파트장님";
};

// 참석자 명단을 참고해 발표용 소속/이름/직책 호칭을 보정합니다.
// - 이름에 직책이 섞여 있으면 제거
// - 소속에 "지역단/영업단/FP센터" 등 접미사가 없으면 명단에서 찾아 채움 (이미 있으면 그대로 사용해 "지역단지역단" 같은 중복 방지)
// - 명단에서 직책(지역단장/파트장 등)을 찾아 "단장님" 또는 "파트장님" 중 맞는 호칭을 선택
export function resolveWinnerDisplay(rawName: string, rawDepartment: string): ResolvedWinner {
  const name = stripLeaderTitle(rawName);
  const department = rawDepartment.trim();
  const record = findAttendeeByName(name);
  const alreadyHasSuffix = hasDepartmentSuffix(department);

  if (!record) {
    // 명단에서 못 찾은 경우, 소속에 접미사가 없으면 지역단 추첨 기본값으로 보정합니다.
    const fallbackDepartment = !alreadyHasSuffix && department ? `${department}지역단` : department;
    return { department: fallbackDepartment, name, titleSuffix: "단장님" };
  }

  const resolvedDepartment = alreadyHasSuffix ? department : record.department || department;

  return {
    department: resolvedDepartment,
    name,
    titleSuffix: titleSuffixFor(record.title),
  };
}
