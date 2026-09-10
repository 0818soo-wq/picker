"use client";

import { motion } from "framer-motion";
import type { PrizeRound } from "@/lib/prizeRounds";
import { splitIntoRows, type ReelEntry } from "@/components/SlotReel";
import { resolveWinnerDisplay } from "@/lib/format";

const APPLE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// 등수 추첨이 끝난 직후 발표 화면입니다. 16:9 와이드 화면 안에
// 왼쪽=상품 정보(원형 사진), 오른쪽=당첨자 버튼(누르면 실제 작성 카드 팝업).
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
  // 3등~1등처럼 당첨자가 적을 때는 카드를 더 크게 보여줍니다. 1~2명일 때는 화면이
  // 텅 비어 보이지 않도록 카드와 글자를 한층 더 키웁니다.
  const isFewWinners = winners.length <= 3;
  const isVeryFewWinners = winners.length <= 2;

  const cardClassName = isVeryFewWinners
    ? "flex flex-col items-center gap-2 rounded-2xl bg-white px-14 py-10 text-center shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
    : isFewWinners
      ? "flex flex-col items-center gap-1.5 rounded-2xl bg-white px-8 py-6 text-center shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
      : "flex flex-col items-center gap-1.5 rounded-2xl bg-white px-5 py-4 text-center shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50";

  const departmentClassName = isVeryFewWinners
    ? "truncate text-lg text-slate-400"
    : isFewWinners
      ? "truncate text-base text-slate-400 sm:text-lg"
      : "truncate text-sm text-slate-400 sm:text-base";

  const nameClassName = isVeryFewWinners
    ? "truncate text-4xl font-bold text-slate-900 sm:text-5xl"
    : isFewWinners
      ? "truncate text-2xl font-bold text-slate-900 sm:text-3xl"
      : "truncate text-lg font-bold text-slate-900 sm:text-xl";

  const prizeImageBoxClassName = isVeryFewWinners
    ? "flex h-40 w-48 items-center justify-center sm:h-56 sm:w-64"
    : "flex h-32 w-40 items-center justify-center sm:h-44 sm:w-56";

  const prizeNameClassName = isVeryFewWinners
    ? "whitespace-pre-line text-center text-base font-semibold leading-snug text-slate-700 sm:text-xl"
    : "whitespace-pre-line text-center text-base font-semibold leading-snug text-slate-700 sm:text-lg";

  // 4등처럼 한 등수 안에 서로 다른 상품이 섞여 있을 때, 줄마다 작은 라벨을 붙여
  // 구분해 보여줍니다(예: 상단 5명 배드민턴 유니폼 / 하단 5명 탁구 유니폼).
  const labeledRows =
    round.rowLabels && round.rowLabels.length > 0
      ? splitIntoRows(winners, Math.ceil(winners.length / round.rowLabels.length))
      : null;

  function renderWinnerCard(w: ReelEntry) {
    const resolved = resolveWinnerDisplay(w.name, w.department);
    return (
      <button key={w.id} type="button" onClick={() => onSelectWinner(w)} className={cardClassName}>
        <span className={departmentClassName}>{resolved.department}</span>
        <span className={nameClassName}>
          {resolved.name}
          {resolved.titleSuffix}
        </span>
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div
        className="relative flex w-full flex-col overflow-hidden rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] ring-1 ring-white/60 sm:min-h-[78vh]"
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

        <div className="relative z-10 flex flex-col items-center gap-1 pt-6 text-center sm:pt-8">
          <span className="text-base font-medium text-slate-500 sm:text-lg">&lsquo;26.하 CSM전략회의 이벤트</span>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">축하합니다!</h1>
        </div>

        <div className="relative z-10 grid flex-1 grid-cols-1 items-center gap-6 px-6 py-6 sm:grid-cols-[minmax(0,260px)_1fr] sm:gap-10 sm:overflow-hidden sm:px-14 sm:py-4">
          <div className="flex flex-col items-center gap-4">
            <span className="inline-flex w-fit items-center rounded-full bg-[#13294b] px-8 py-2.5 text-3xl font-black text-white sm:px-10 sm:py-3 sm:text-4xl">
              {round.label}
            </span>
            <div className={prizeImageBoxClassName}>
              {round.prizeImage ? (
                /* eslint-disable-next-line @next/next/no-img-element -- 상품 사진은 next/image 최적화 없이 원본 그대로 표시합니다. */
                <img src={round.prizeImage} alt={round.prizeName} className="h-full w-full object-contain drop-shadow-md" />
              ) : (
                <svg viewBox="0 0 100 100" className="h-12 w-12 text-slate-500/60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="20" y="40" width="60" height="45" rx="4" stroke="currentColor" strokeWidth="4" />
                  <rect x="12" y="26" width="76" height="18" rx="4" stroke="currentColor" strokeWidth="4" />
                </svg>
              )}
            </div>
            <p className={prizeNameClassName}>{round.prizeName}</p>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 sm:items-center">
            <span className="text-sm font-medium text-slate-400 text-center sm:text-base">{round.label} 당첨자</span>
            {labeledRows ? (
              <div className="flex flex-col items-center gap-6">
                {labeledRows.map((rowWinners, rowIndex) => (
                  <div key={rowIndex} className="flex flex-col items-center gap-2">
                    {round.rowLabels?.[rowIndex] && (
                      <span className="text-sm font-medium text-slate-400 sm:text-base">{round.rowLabels[rowIndex]}</span>
                    )}
                    <div className="grid grid-cols-3 content-start items-start justify-center justify-items-stretch gap-4 sm:grid-cols-6">
                      {rowWinners.map(renderWinnerCard)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className={
                  isFewWinners
                    ? "flex flex-wrap items-center justify-center gap-4"
                    : "grid grid-cols-3 content-start items-start justify-center justify-items-stretch gap-4"
                }
              >
                {winners.map(renderWinnerCard)}
              </div>
            )}
          </div>
        </div>
      </div>

      <motion.button
        type="button"
        onClick={onNext}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.2, ease: APPLE_EASE }}
        className="flex h-14 w-64 items-center justify-center rounded-full bg-slate-900 text-base font-semibold text-white shadow-sm hover:bg-slate-700"
      >
        {isLast ? "추첨 마치기" : "다음 추첨하기"}
      </motion.button>
    </div>
  );
}
