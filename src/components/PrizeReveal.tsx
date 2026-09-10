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
  // 1~2명일 때는 화면이 텅 비어 보이지 않도록 카드와 글자를 가장 크게 보여줍니다.
  const isVeryFewWinners = winners.length <= 2;
  const isSolo = winners.length === 1;
  const isDuo = winners.length === 2;

  const cardClassName = isVeryFewWinners
    ? "flex flex-col items-center gap-3 rounded-2xl bg-white px-16 py-12 text-center shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
    : "flex flex-col items-center gap-2 rounded-2xl bg-white px-8 py-6 text-center shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50";

  const departmentClassName = isVeryFewWinners
    ? "truncate text-2xl text-slate-400"
    : "truncate text-lg text-slate-400 sm:text-2xl";

  const nameClassName = isVeryFewWinners
    ? "truncate text-6xl font-bold text-slate-900 sm:text-7xl"
    : "truncate text-2xl font-bold text-slate-900 sm:text-4xl";

  const prizeImageBoxClassName = isVeryFewWinners
    ? "flex h-56 w-64 items-center justify-center sm:h-72 sm:w-80"
    : "flex h-44 w-52 items-center justify-center sm:h-64 sm:w-72";

  const prizeNameClassName = isVeryFewWinners
    ? "whitespace-pre-line text-center text-xl font-semibold leading-snug text-slate-700 sm:text-2xl"
    : "whitespace-pre-line text-center text-lg font-semibold leading-snug text-slate-700 sm:text-xl";

  // 4등처럼 한 등수 안에 서로 다른 상품이 섞여 있을 때는 라벨 그룹(예: 배드민턴/탁구)으로
  // 먼저 나누고, 그렇지 않으면 전체 당첨자를 하나의 그룹으로 다룹니다. 각 그룹 안에서는
  // round.revealMaxPerRow(기본 3명)명씩 끊어 여러 줄로 보여줍니다.
  const rowGroups = (() => {
    if (winners.length <= 2) return [];
    const groups =
      round.rowLabels && round.rowLabels.length > 0
        ? splitIntoRows(winners, Math.ceil(winners.length / round.rowLabels.length))
        : [winners];
    const perRow = round.revealMaxPerRow ?? 3;
    return groups.map((group, i) => ({
      label: round.rowLabels?.[i],
      rows: splitIntoRows(group, perRow),
    }));
  })();

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

        <div className="relative z-10 flex flex-col items-center gap-1 pt-8 text-center sm:pt-10">
          <span className="text-lg font-medium text-slate-500 sm:text-2xl">&lsquo;26.하 CSM전략회의 이벤트</span>
          <h1 className="text-5xl font-black tracking-tight text-slate-900 sm:text-7xl">축하합니다!</h1>
        </div>

        <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-8 sm:px-10 sm:py-6">
          <div className="grid w-full max-w-[1500px] grid-cols-1 items-center gap-8 sm:grid-cols-[minmax(0,320px)_1fr] sm:gap-14">
            <div className="flex flex-col items-center gap-4">
              <span className="inline-flex w-fit items-center rounded-full bg-[#13294b] px-10 py-3 text-4xl font-black text-white sm:px-14 sm:py-4 sm:text-6xl">
                {round.label}
              </span>
              <div className={prizeImageBoxClassName}>
                {round.prizeImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- 상품 사진은 next/image 최적화 없이 원본 그대로 표시합니다. */
                  <img src={round.prizeImage} alt={round.prizeName} className="h-full w-full object-contain drop-shadow-md" />
                ) : (
                  <svg viewBox="0 0 100 100" className="h-14 w-14 text-slate-500/60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="20" y="40" width="60" height="45" rx="4" stroke="currentColor" strokeWidth="4" />
                    <rect x="12" y="26" width="76" height="18" rx="4" stroke="currentColor" strokeWidth="4" />
                  </svg>
                )}
              </div>
              <p className={prizeNameClassName}>{round.prizeName}</p>
            </div>

            <div className="flex flex-col items-center justify-center gap-4">
              <span className="text-lg font-medium text-slate-400 text-center sm:text-2xl">{round.label} 당첨자</span>

              {isSolo || isDuo ? (
                <div className={isDuo ? "flex flex-col items-center gap-6" : "flex flex-col items-center"}>
                  {winners.map(renderWinnerCard)}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-8">
                  {rowGroups.map((group, gi) => (
                    <div key={gi} className="flex flex-col items-center gap-3">
                      {group.label && (
                        <span className="text-lg font-medium text-slate-400 sm:text-2xl">{group.label}</span>
                      )}
                      <div className="flex flex-col items-center gap-4">
                        {group.rows.map((row, ri) => (
                          <div key={ri} className="flex flex-wrap items-stretch justify-center gap-4">
                            {row.map(renderWinnerCard)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <motion.button
        type="button"
        onClick={onNext}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.2, ease: APPLE_EASE }}
        className="flex h-16 w-72 items-center justify-center rounded-full bg-slate-900 text-xl font-semibold text-white shadow-sm hover:bg-slate-700"
      >
        {isLast ? "추첨 마치기" : "다음 추첨하기"}
      </motion.button>
    </div>
  );
}
