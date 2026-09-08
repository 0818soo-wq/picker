"use client";

import { motion } from "framer-motion";
import type { PrizeRound } from "@/lib/prizeRounds";

const APPLE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// 등수별 추첨 시작 전, 상품을 소개하는 화면입니다.
// 왼쪽=등수, 가운데=상품 사진/이름, 오른쪽=이번 라운드 추첨 인원.
export default function PrizeIntro({
  round,
  onStart,
  starting,
}: {
  round: PrizeRound;
  onStart: () => void;
  starting: boolean;
}) {
  return (
    <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white/60 shadow-[0_8px_40px_rgba(0,0,0,0.08)] ring-1 ring-white/60 backdrop-blur-2xl">
      <div className="flex flex-col items-center gap-2 px-6 pt-8 text-center">
        <span className="text-sm font-medium text-slate-500">&lsquo;26.하 CSM전략회의 이벤트</span>
      </div>

      <div className="grid grid-cols-1 items-center gap-6 px-6 py-10 sm:grid-cols-[auto_1fr_auto] sm:gap-8 sm:px-12">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">등수</span>
          <span className="text-6xl font-black tracking-tighter text-slate-900 sm:text-7xl">{round.label}</span>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-[#eaf2fb] to-[#9fb9d6] shadow-inner sm:h-48 sm:w-48">
            {round.prizeImage ? (
              /* eslint-disable-next-line @next/next/no-img-element -- 상품 사진은 next/image 최적화 없이 원본 그대로 표시합니다. */
              <img src={round.prizeImage} alt={round.prizeName} className="h-full w-full object-cover" />
            ) : (
              <svg viewBox="0 0 100 100" className="h-16 w-16 text-slate-500/60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="20" y="40" width="60" height="45" rx="4" stroke="currentColor" strokeWidth="4" />
                <rect x="12" y="26" width="76" height="18" rx="4" stroke="currentColor" strokeWidth="4" />
                <line x1="50" y1="26" x2="50" y2="85" stroke="currentColor" strokeWidth="4" />
                <path d="M50 26c0-9-8-16-16-16s-8 16 16 16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <path d="M50 26c0-9 8-16 16-16s8 16-16 16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            )}
          </div>
          <p className="max-w-xs text-center text-xl font-bold text-slate-900 sm:text-2xl">{round.prizeName}</p>
        </div>

        <div className="flex flex-col items-center gap-1 sm:items-end">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">추첨 인원</span>
          <span className="flex items-baseline gap-1 text-6xl font-black tracking-tighter text-blue-600 sm:text-7xl">
            {round.count}
            <span className="text-xl font-semibold text-slate-400">명</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 px-6 pb-10">
        <motion.button
          type="button"
          onClick={onStart}
          disabled={starting}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.2, ease: APPLE_EASE }}
          className="flex h-16 w-64 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white shadow-sm transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {starting ? "준비 중..." : "추첨하러가기"}
        </motion.button>
      </div>
    </div>
  );
}
