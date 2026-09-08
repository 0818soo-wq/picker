// '26.하 CSM전략회의 이벤트의 등수별 추첨 라운드 설정입니다.
// 5등부터 1등까지 순서대로 진행하며, 각 라운드가 끝난 인원은 자동으로
// 다음 라운드 추첨 대상에서 제외됩니다(이미 존재하는 is_winner 로직 재사용).
//
// prizeImage는 아직 실제 상품 사진을 받기 전이라 비워둡니다.
// 사진을 전달받으면 public/images/prizes/ 아래에 넣고 이 값을 채웁니다.

export type PrizeRank = 1 | 2 | 3 | 4 | 5;

export type PrizeRound = {
  rank: PrizeRank;
  label: string; // 예: "5등"
  prizeName: string; // 예: "삼성라이온즈 굿즈"
  count: number; // 이 등수에서 뽑는 인원 수
  prizeImage: string | null; // public/ 기준 경로. 아직 없으면 null
};

// 진행 순서: 5등 -> 4등 -> 3등 -> 2등 -> 1등 (배열 순서 = 진행 순서)
export const PRIZE_ROUNDS: PrizeRound[] = [
  { rank: 5, label: "5등", prizeName: "삼성라이온즈 굿즈", count: 10, prizeImage: null },
  { rank: 4, label: "4등", prizeName: "배드민턴&탁구 선수단 사인 유니폼", count: 12, prizeImage: null },
  { rank: 3, label: "3등", prizeName: "블루밍스 여자농구단 사인 공인구", count: 2, prizeImage: null },
  { rank: 2, label: "2등", prizeName: "배드민턴 선수단 사인 라켓&가방", count: 1, prizeImage: null },
  { rank: 1, label: "1등", prizeName: "안세영선수 유니폼 & 배드민턴 선수단 사인 라켓&가방", count: 1, prizeImage: null },
];

export function getPrizeRound(rank: PrizeRank): PrizeRound {
  const round = PRIZE_ROUNDS.find((r) => r.rank === rank);
  if (!round) throw new Error(`알 수 없는 등수: ${rank}`);
  return round;
}

export function getNextRoundIndex(completedCounts: Record<number, number>): number {
  return PRIZE_ROUNDS.findIndex((round) => (completedCounts[round.rank] ?? 0) < round.count);
}
