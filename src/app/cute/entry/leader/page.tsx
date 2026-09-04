import type { Metadata } from "next";
import CuteEntryForm from "@/components/CuteEntryForm";

export const metadata: Metadata = {
  title: "[디자인 비교] 지역단장 접수",
};

export default function CuteLeaderEntryPage() {
  return <CuteEntryForm groupType="draw" />;
}
