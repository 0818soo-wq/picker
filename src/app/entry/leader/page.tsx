import type { Metadata } from "next";
import EntryForm from "@/components/EntryForm";

export const metadata: Metadata = {
  title: "'26.하 CSM전략회의 이벤트 접수",
};

// 지역단장/파트장 구분 없이 모두가 같은 링크로 접수합니다. 추첨 대상 여부는
// 여기서 넘기는 groupType이 아니라, 서버가 사번으로 조회한 실제 직책(명단
// 기준)만으로 판단합니다 (src/app/api/entries/route.ts 참고).
export default function LeaderEntryPage() {
  return <EntryForm groupType="draw" />;
}
