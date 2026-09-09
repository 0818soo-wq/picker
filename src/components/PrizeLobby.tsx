"use client";

import EventBanner from "@/components/EventBanner";
import AdminSubNav from "@/components/AdminSubNav";
import Confetti from "@/components/Confetti";
import { PRIZE_ROUNDS } from "@/lib/prizeRounds";
import { resolveWinnerDisplay } from "@/lib/format";
import type { ReelEntry } from "@/components/SlotReel";

type WinnerEntry = ReelEntry & { prize_rank: number | null };

// "관리하기" 화면. 5등~1등을 나란히 세로 열(컬럼)로 배치해 각 열 아래에
// 당첨자 버튼을 쌓아 보여줍니다. 아직 추첨 전인 등수는 열이 비어있습니다.
export default function PrizeLobby({
  winners,
  onSelectWinner,
  onStartDraw,
  onSelectRound,
  entriesOpen,
  onToggleEntriesOpen,
}: {
  winners: WinnerEntry[];
  onSelectWinner: (winner: WinnerEntry) => void;
  onStartDraw: () => void;
  onSelectRound: (rank: number) => void;
  entriesOpen: boolean | null;
  onToggleEntriesOpen: () => void;
}) {
  const hasRemainingRound = PRIZE_ROUNDS.some(
    (round) => winners.filter((w) => w.prize_rank === round.rank).length < round.count
  );

  return (
    <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white/60 shadow-[0_8px_40px_rgba(0,0,0,0.08)] ring-1 ring-white/60 backdrop-blur-2xl">
      {!hasRemainingRound && <Confetti />}
      {hasRemainingRound ? (
        <EventBanner
          badge="추첨 현황"
          titleLine1="CSM전략회의 EVENT 추첨을 시작할까요?"
          titlePrefix=""
          titleHighlight=""
          titleSuffix=""
          titleSize="large"
          subtitleLine1=""
          subtitleLine2=""
        />
      ) : (
        <EventBanner
          badge="추첨 현황"
          titleLine1="당첨을 축하합니다!"
          titlePrefix=""
          titleHighlight=""
          titleSuffix=""
          titleSize="large"
          subtitleLine1="2027년의 좋은 기운을 받아 총 27명의 당첨자에게 개별적으로 선물이 전달됩니다."
          subtitleLine2=""
        />
      )}

      <div className="flex flex-col gap-6 px-6 py-8 sm:px-10 sm:py-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
          {PRIZE_ROUNDS.map((round) => {
            const roundWinners = winners.filter((w) => w.prize_rank === round.rank);

            const roundIncomplete = roundWinners.length < round.count;

            return (
              <div key={round.rank} className="flex flex-col gap-3 rounded-2xl bg-white/50 p-4 ring-1 ring-white/60 backdrop-blur-xl">
                <div className="flex flex-col items-center gap-1 text-center">
                  {roundIncomplete ? (
                    <button
                      type="button"
                      onClick={() => onSelectRound(round.rank)}
                      title="이 등수 추첨하기"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#13294b] text-sm font-bold text-white transition-colors hover:bg-[#1c3a68]"
                    >
                      {round.rank}
                    </button>
                  ) : (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#13294b] text-sm font-bold text-white">
                      {round.rank}
                    </span>
                  )}
                  <span className="text-sm font-bold text-slate-900">
                    {round.label}({round.count}명)
                  </span>
                  <div className="flex h-12 w-16 items-center justify-center">
                    {round.prizeImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element -- 상품 사진은 next/image 최적화 없이 원본 그대로 표시합니다. */
                      <img src={round.prizeImage} alt={round.prizeName} className="h-full w-full object-contain" />
                    ) : (
                      <svg viewBox="0 0 100 100" className="h-6 w-6 text-slate-500/60" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="20" y="40" width="60" height="45" rx="4" stroke="currentColor" strokeWidth="6" />
                        <rect x="12" y="26" width="76" height="18" rx="4" stroke="currentColor" strokeWidth="6" />
                      </svg>
                    )}
                  </div>
                  <span className="line-clamp-2 whitespace-pre-line text-[11px] text-slate-500">{round.prizeName}</span>
                </div>

                <div className="flex flex-col gap-2">
                  {roundWinners.length > 0 ? (
                    roundWinners.map((w) => {
                      const resolved = resolveWinnerDisplay(w.name, w.department);
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => onSelectWinner(w)}
                          className="flex flex-col items-center gap-0.5 rounded-xl bg-white px-2 py-2 text-center shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
                        >
                          <span className="truncate text-[10px] text-slate-400">{resolved.department}</span>
                          <span className="truncate text-xs font-bold text-slate-900">
                            {resolved.name}
                            {resolved.titleSuffix}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <span className="py-2 text-center text-xs text-slate-400">추첨 전</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {hasRemainingRound && (
          <button
            type="button"
            onClick={onStartDraw}
            className="mx-auto flex h-14 w-64 items-center justify-center rounded-full bg-slate-900 text-base font-bold text-white shadow-sm transition-colors hover:bg-slate-700"
          >
            추첨하기
          </button>
        )}

        {entriesOpen !== null && (
          <div className="mx-auto flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${entriesOpen ? "bg-blue-500" : "bg-red-500"}`}
              aria-hidden="true"
            />
            <span className="text-xs text-slate-500">{entriesOpen ? "접수중" : "접수중단"}</span>
            <button
              type="button"
              onClick={onToggleEntriesOpen}
              className="ml-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200"
            >
              {entriesOpen ? "접수중단하기" : "접수재개하기"}
            </button>
          </div>
        )}

        <AdminSubNav />
      </div>
    </div>
  );
}
