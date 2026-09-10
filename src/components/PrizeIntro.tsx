"use client";

import { motion } from "framer-motion";
import type { PrizeRound } from "@/lib/prizeRounds";

const APPLE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// 등수별 추첨 시작 전, 상품을 소개하는 화면입니다. PC/프로젝터 화면에
// 맞춘 16:9 와이드 레이아웃: 왼쪽=등수, 가운데=상품 사진(원형)/이름, 오른쪽=추첨 인원.
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
    <div className="flex w-full flex-col items-center gap-6">
      <div
        className="relative flex w-full flex-col overflow-hidden rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] ring-1 ring-white/60 sm:min-h-[85vh]"
        style={{ background: "linear-gradient(180deg, #eaf2fb 0%, #cfe0f2 45%, #9fb9d6 100%)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- next/image의 fill 방식이 프로덕션에서 간헐적으로 로드 실패해 일반 img로 우회합니다. 좁은 모바일 화면에서는 와이드 사진이 부자연스럽게 잘려 sm 이상에서만 보여줍니다. */}
        <img
          src="/images/event-visual-draw.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 hidden h-full w-full object-cover sm:block"
        />
        <div className="absolute inset-0 hidden bg-white/55 backdrop-blur-md sm:block" />

        <div className="relative z-10 pt-8 text-center sm:pt-10">
          <span className="text-lg font-medium text-slate-500 sm:text-2xl">&lsquo;26.하 CSM전략회의 이벤트</span>
        </div>

        <div className="relative z-10 grid flex-1 grid-cols-1 items-center gap-8 px-6 py-8 sm:grid-cols-3 sm:gap-6 sm:px-16 sm:py-0">
          <div className="flex flex-col items-center gap-2">
            <span className="text-lg font-medium uppercase tracking-wide text-slate-400 sm:text-2xl">등수</span>
            <span className="text-8xl font-black leading-none tracking-tighter text-slate-900 sm:text-[10rem]">{round.label}</span>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="flex h-48 w-56 items-center justify-center sm:h-72 sm:w-80">
              {round.prizeImage ? (
                /* eslint-disable-next-line @next/next/no-img-element -- 상품 사진은 next/image 최적화 없이 원본 그대로 표시합니다. */
                <img src={round.prizeImage} alt={round.prizeName} className="h-full w-full object-contain drop-shadow-md" />
              ) : (
                <svg viewBox="0 0 100 100" className="h-20 w-20 text-slate-500/60 sm:h-24 sm:w-24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="20" y="40" width="60" height="45" rx="4" stroke="currentColor" strokeWidth="4" />
                  <rect x="12" y="26" width="76" height="18" rx="4" stroke="currentColor" strokeWidth="4" />
                  <line x1="50" y1="26" x2="50" y2="85" stroke="currentColor" strokeWidth="4" />
                  <path d="M50 26c0-9-8-16-16-16s-8 16 16 16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  <path d="M50 26c0-9 8-16 16-16s8 16-16 16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <p className="max-w-xs whitespace-pre-line text-center text-2xl font-bold leading-snug text-slate-900 sm:max-w-md sm:text-4xl">
              {round.prizeName}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-lg font-medium uppercase tracking-wide text-slate-400 sm:text-2xl">추첨 인원</span>
            <span className="flex items-baseline gap-2 text-8xl font-black leading-none tracking-tighter text-blue-600 sm:text-[10rem]">
              {round.count}
              <span className="text-2xl font-semibold text-slate-400 sm:text-4xl">명</span>
            </span>
          </div>
        </div>

        <div className="relative z-10 pb-8 sm:pb-10" />
      </div>

      <motion.button
        type="button"
        onClick={onStart}
        disabled={starting}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.2, ease: APPLE_EASE }}
        className="flex h-20 w-80 items-center justify-center rounded-full bg-slate-900 text-2xl font-bold text-white shadow-sm transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {starting ? "준비 중..." : "추첨하기"}
      </motion.button>
    </div>
  );
}
