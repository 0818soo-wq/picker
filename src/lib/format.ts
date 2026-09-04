// 이름 입력란에 실수로 "OOO단장", "OOO단장님"처럼 직책을 함께 적은 경우,
// 발표 문구에서 "단장님단장님"처럼 중복되지 않도록 끝의 직책 표현을 제거합니다.
export function stripLeaderTitle(name: string): string {
  return name.trim().replace(/(단장님|단장)$/u, "").trim();
}
