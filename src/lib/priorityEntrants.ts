// 접수 시 추첨에서 우선순위(가중치)를 받는 대상 목록입니다. department+name이 일치하면
// 매 등수 추첨마다 각 자리에 10% 확률로 우선 배정되지만, 그렇지 않은 경우에도 일반
// 추첨 풀에 그대로 남아 있어 당첨 기회 자체를 잃지는 않습니다.
export const PRIORITY_ENTRANTS: { department: string; name: string }[] = [
  { department: "서울법인지역단", name: "황재용" },
  { department: "서울법인지역단", name: "김승현" },
  { department: "삼성법인지역단", name: "김승철" },
  { department: "강남법인지역단", name: "박시영" },
  { department: "서초법인지역단", name: "강전봉" },
  { department: "경인법인지역단", name: "최병선" },
  { department: "경기법인지역단", name: "장승호" },
  { department: "충청법인지역단", name: "김정민" },
  { department: "부산법인지역단", name: "김국련" },
  { department: "대구법인지역단", name: "윤익진" },
  { department: "호남법인지역단", name: "이동필" },
  { department: "SFP서울지역단", name: "이순규" },
  { department: "SFP부산지역단", name: "박상준" },
  { department: "BA영업추진P", name: "정기원" },
  { department: "BA강남지역단", name: "김철규" },
  { department: "BA강북지역단", name: "이건희" },
  { department: "BA경인지역단", name: "김도윤" },
  { department: "BA영남지역단", name: "이치영" },
  { department: "BA서부지역단", name: "신상영" },
];

const PRIORITY_KEYS = new Set(PRIORITY_ENTRANTS.map((p) => `${p.department}::${p.name}`));

export function isPriorityEntrant(department: string, name: string): boolean {
  return PRIORITY_KEYS.has(`${department}::${name}`);
}
