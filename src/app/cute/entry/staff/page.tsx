import type { Metadata } from "next";
import CuteEntryForm from "@/components/CuteEntryForm";

export const metadata: Metadata = {
  title: "[디자인 비교] 파트장 접수",
};

export default function CuteStaffEntryPage() {
  return <CuteEntryForm groupType="no_draw" />;
}
