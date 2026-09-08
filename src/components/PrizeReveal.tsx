"use client";

import { motion } from "framer-motion";
import type { PrizeRound } from "@/lib/prizeRounds";
import type { ReelEntry } from "@/components/SlotReel";
import { resolveWinnerDisplay } from "@/lib/format";

const APPLE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// 등수 추첨이 끝난 직후 발표 화면입니다.
// 왼쪽=상품 정보, 오른쪽=당첨자 버튼(누르면 실제 작성 카드 팝업).
export default function PrizeReveal({
  round,
  winners,
  isLast,
  onNext,
  onSelectWinner,
}: {
  round: PrizeRound;
  winners: ReelEntry[];
  isLast: boolean;
  onNext: () => void;
  onSelectWinner: (winner: ReelEntry) => void;
}) {
  const columns = winners.length <= 1 ? 1 : winners.length <= 4 ? 2 : 3;

  return (
    <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white/60 shadow-[0_8px_40px_rgba(0,0,0,0.08)] ring-1 ring-white/60 backdrop-blur-2xl">
      <div className="flex flex-col items-center gap-1 px-6 pt-8 text-center">
        <span className="text-sm font-medium text-slate-500">&lsquo;26.하 CSM전략회의 이벤트</span>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">축하합니다!</h1>
      </div>

      <div className="grid grid-cols-1 gap-8 px-6 py-8 sm:grid-cols-[minmax(0,180px)_1fr] sm:px-10">
        <div className="flex flex-col items-center gap-3 sm:items-start">
          <span className="inline-flex w-fit items-center rounded-full bg-[#13294b] px-3 py-1 text-xs font-bold text-white">
            {round.label}
          </span>
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-[#eaf2fb] to-[#9fb9d6] shadow-inner">
            {round.prizeImage ? (
              /* eslint-disable-next-line @next/next/no-img-element -- 상품 사진은 next/image 최적화 없이 원본 그대로 표시합니다. */
              <img src={round.prizeImage} alt={round.prizeName} className="h-full w-full object-cover" />
            ) : (
              <svg viewBox="0 0 100 100" className="h-12 w-12 text-slate-500/60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="20" y="40" width="60" height="45" rx="4" stroke="currentColor" strokeWidth="4" />
                <rect x="12" y="26" width="76" height="18" rx="4" stroke="currentColor" strokeWidth="4" />
              </svg>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-700 sm:max-w-[10rem]">{round.prizeName}</p>
        </div>

        <div
          className="grid content-start gap-3"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {winners.map((w) => {
            const resolved = resolveWinnerDisplay(w.name, w.department);
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => onSelectWinner(w)}
                className="flex flex-col items-center gap-0.5 rounded-2xl bg-white px-4 py-3 text-center shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
              >
                <span className="truncate text-xs text-slate-400">{resolved.department}</span>
                <span className="truncate text-base font-bold text-slate-900">
                  {resolved.name}
                  {resolved.titleSuffix}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 px-6 pb-10">
        <motion.button
          type="button"
          onClick={onNext}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.2, ease: APPLE_EASE }}
          className="flex h-14 w-64 items-center justify-center rounded-full bg-slate-900 text-base font-semibold text-white shadow-sm hover:bg-slate-700"
        >
          {isLast ? "추첨 마치기" : "다음 추첨하러가기"}
        </motion.button>
      </div>
    </div>
  );
}
