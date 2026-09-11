// 접수 시 추첨에서 우선순위(가중치)를 받는 대상 목록입니다. department+name이 일치하면
// 매 등수 추첨마다 각 자리에서 본인의 chance 확률로 우선 배정되지만, 그렇지 않은
// 경우(확률에서 떨어진 경우)에도 일반 추첨 풀에 그대로 남아 있어 당첨 기회 자체를
// 잃지는 않습니다. 당첨이 "보장"되는 것은 아니며, 이미 다른 등수에서 당첨된 사람은
// (우선순위 대상이어도) 추첨 대상에서 자동으로 제외되어 중복 당첨될 수 없습니다.
export const PRIORITY_ENTRANTS: { department: string; name: string; chance: number }[] = [
  { department: "동대문지역단", name: "김철홍", chance: 0.5 },
  { department: "서울법인지역단", name: "황재용", chance: 0.2 },
  { department: "서울법인지역단", name: "김승현", chance: 0.2 },
  { department: "삼성법인지역단", name: "김승철", chance: 0.2 },
  { department: "강남법인지역단", name: "박시영", chance: 0.2 },
  { department: "서초법인지역단", name: "강전봉", chance: 0.2 },
  { department: "경인법인지역단", name: "최병선", chance: 0.2 },
  { department: "경기법인지역단", name: "장승호", chance: 0.2 },
  { department: "충청법인지역단", name: "김정민", chance: 0.2 },
  { department: "부산법인지역단", name: "김국련", chance: 0.2 },
  { department: "대구법인지역단", name: "윤익진", chance: 0.2 },
  { department: "호남법인지역단", name: "이동필", chance: 0.2 },
  { department: "SFP서울지역단", name: "이순규", chance: 0.2 },
  { department: "SFP부산지역단", name: "박상준", chance: 0.2 },
  { department: "BA영업추진P", name: "정기원", chance: 0.2 },
  { department: "BA강남지역단", name: "김철규", chance: 0.2 },
  { department: "BA강북지역단", name: "이건희", chance: 0.2 },
  { department: "BA경인지역단", name: "김도윤", chance: 0.2 },
  { department: "BA영남지역단", name: "이치영", chance: 0.2 },
  { department: "BA서부지역단", name: "신상영", chance: 0.2 },
];

const PRIORITY_CHANCE_BY_KEY = new Map(
  PRIORITY_ENTRANTS.map((p) => [`${p.department}::${p.name}`, p.chance])
);

export function isPriorityEntrant(department: string, name: string): boolean {
  return PRIORITY_CHANCE_BY_KEY.has(`${department}::${name}`);
}

// 우선순위 대상이 아니면 0을 돌려줍니다(우선 배정 없이 일반 추첨만 적용).
export function getPriorityChance(department: string, name: string): number {
  return PRIORITY_CHANCE_BY_KEY.get(`${department}::${name}`) ?? 0;
}
