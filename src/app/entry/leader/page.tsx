import type { Metadata } from "next";
import EntryForm from "@/components/EntryForm";

export const metadata: Metadata = {
  title: "'26.하 CSM전략회의 이벤트 접수 (현장)",
};

export default function LeaderEntryPage() {
  return <EntryForm groupType="draw" />;
}
