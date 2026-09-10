import { redirect } from "next/navigation";

// 이 사이트는 별도 안내 페이지 없이 아래 링크로만 공유합니다.
// - /entry/leader (접수 링크, 지역단장/파트장 구분 없이 동일하게 공유)
// - /draw         (AI 당첨자 추첨 Agent, 진행자용)
// 추첨 대상 여부는 사번으로 조회한 실제 직책(명단 기준)으로 서버가 판단합니다.
// 루트 주소로 들어오면 진행자용 화면으로 보냅니다.
export default function Home() {
  redirect("/draw");
}
