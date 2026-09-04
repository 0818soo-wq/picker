import type { Metadata } from "next";
import EntryForm from "@/components/EntryForm";

export const metadata: Metadata = {
  title: "'26.하 CSM전략회의 이벤트 접수 (본사)",
};

export default function StaffEntryPage() {
  return <EntryForm groupType="no_draw" />;
}
