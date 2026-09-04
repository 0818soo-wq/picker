import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "[디자인 비교] 귀여운 톤",
};

// 디자인 비교용 시안 페이지입니다. 실제 서비스 플로우와는 별개로, 톤만 비교하기 위한 정적 화면입니다.
export default function CuteCoverPage() {
  return (
    <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center overflow-hidden bg-[#eaf3ff] px-6 py-16 text-center">
      <div className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full bg-white/60 blur-2xl" />
      <div className="pointer-events-none absolute -right-10 bottom-10 h-72 w-72 rounded-full bg-blue-200/50 blur-2xl" />
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-4 w-4 rounded-full bg-blue-300/70" />
      <div className="pointer-events-none absolute right-1/4 top-1/3 h-3 w-3 rounded-full bg-blue-400/70" />

      <div className="relative z-10 mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-blue-500 shadow-sm">
        🥕 디자인 비교 시안
      </div>

      <h1 className="relative z-10 flex flex-col items-center gap-3 font-cute">
        <span className="text-base text-blue-500 sm:text-lg">&lsquo;26.하 CSM전략회의 이벤트</span>
        <span className="text-4xl text-blue-950 sm:text-6xl">
          AI 당첨자 추첨 <span className="text-blue-500">Agent</span>
        </span>
      </h1>

      <p className="relative z-10 mt-4 max-w-md text-sm text-blue-900/60 sm:text-base">
        같은 파란색 톤이지만, 당근마켓처럼 둥글둥글하고 아기자기하게 표현해봤어요 🐰💙
      </p>

      <div className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/cute/entry/leader"
          className="flex h-12 w-52 items-center justify-center rounded-full bg-blue-500 text-base font-bold text-white shadow-lg shadow-blue-200 transition-transform hover:scale-105"
        >
          지역단장 접수 보기
        </Link>
        <Link
          href="/cute/entry/staff"
          className="flex h-12 w-52 items-center justify-center rounded-full bg-white text-base font-bold text-blue-600 shadow-sm ring-1 ring-blue-100 transition-transform hover:scale-105"
        >
          파트장 접수 보기
        </Link>
      </div>

      <Link href="/draw#main" className="relative z-10 mt-12 text-xs text-blue-400 hover:text-blue-600">
        ← 원래 디자인(애플 톤)으로 돌아가기
      </Link>
    </main>
  );
}
