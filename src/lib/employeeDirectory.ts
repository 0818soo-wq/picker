// 사번 → 이름 매핑입니다. 사번은 대외비이므로 이 파일은 서버(API 라우트)에서만
// import해야 하며, "use client" 컴포넌트에서는 절대 import하지 마세요.
// (attendees.ts는 화면 표시용으로 클라이언트에서도 쓰이지만, 이 파일은 조회
// 전용으로만 쓰고 값을 그대로 응답하지 않습니다.)

// 사번\t이름 형식으로 한 줄에 한 명씩 채워주세요.
const RAW = `
`;

const EMPLOYEE_ID_TO_NAME = new Map<string, string>(
  RAW.trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split("\t").map((s) => s.trim()))
    .filter(([id, name]) => id && name)
    .map(([id, name]) => [id, name])
);

export function findNameByEmployeeId(employeeId: string): string | undefined {
  return EMPLOYEE_ID_TO_NAME.get(employeeId.trim());
}
