import { redirect } from "next/navigation";

// 이 사이트는 별도 안내 페이지 없이 아래 3개 링크로만 공유합니다.
// - /entry/leader (지역단장 접수)
// - /entry/staff  (본사 파트장 접수)
// - /draw         (AI 당첨자 추첨 Agent, 진행자용)
// 루트 주소로 들어오면 진행자용 화면으로 보냅니다.
export default function Home() {
  redirect("/draw");
}
