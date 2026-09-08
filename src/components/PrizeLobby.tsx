"use client";

import EventBanner from "@/components/EventBanner";
import AdminSubNav from "@/components/AdminSubNav";
import { PRIZE_ROUNDS } from "@/lib/prizeRounds";
import { resolveWinnerDisplay } from "@/lib/format";
import type { ReelEntry } from "@/components/SlotReel";

type WinnerEntry = ReelEntry & { prize_rank: number | null };

// "관리하기" 화면. 5등~1등 등수별로 당첨자 버튼을 보여주고,
// 아직 추첨 전인 등수는 흐리게 "추첨 전"으로 표시합니다.
export default function PrizeLobby({
  winners,
  totalEntries,
  onSelectWinner,
}: {
  winners: WinnerEntry[];
  totalEntries: number;
  onSelectWinner: (winner: WinnerEntry) => void;
}) {
  return (
    <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white/60 shadow-[0_8px_40px_rgba(0,0,0,0.08)] ring-1 ring-white/60 backdrop-blur-2xl">
      <EventBanner
        badge="추첨 현황"
        titleLine1="당첨을 축하합니다!"
        titlePrefix=""
        titleHighlight=""
        titleSuffix=""
        subtitleLine1={`총 ${totalEntries}개의 의견이 접수되었습니다.`}
        subtitleLine2=""
      />

      <div className="flex flex-col gap-6 px-6 py-8 sm:px-10 sm:py-10">
        {PRIZE_ROUNDS.map((round) => {
          const roundWinners = winners.filter((w) => w.prize_rank === round.rank);
          const done = roundWinners.length >= round.count;

          return (
            <div
              key={round.rank}
              className="flex flex-col gap-3 rounded-2xl bg-white/50 px-5 py-4 ring-1 ring-white/60 backdrop-blur-xl sm:flex-row sm:items-center sm:gap-6"
            >
              <div className="flex shrink-0 items-center gap-3 sm:w-48">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#13294b] text-sm font-bold text-white">
                  {round.rank}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">{round.label}</span>
                  <span className="truncate text-xs text-slate-500">{round.prizeName}</span>
                </div>
              </div>

              {roundWinners.length > 0 ? (
                <div className="flex flex-1 flex-wrap gap-2">
                  {roundWinners.map((w) => {
                    const resolved = resolveWinnerDisplay(w.name, w.department);
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => onSelectWinner(w)}
                        className="flex flex-col items-center gap-0.5 rounded-xl bg-white px-3 py-2 text-center shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
                      >
                        <span className="truncate text-[10px] text-slate-400">{resolved.department}</span>
                        <span className="truncate text-sm font-bold text-slate-900">
                          {resolved.name}
                          {resolved.titleSuffix}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span className="text-sm text-slate-400">아직 추첨 전입니다.</span>
              )}

              {!done && roundWinners.length > 0 && (
                <span className="shrink-0 text-xs text-slate-400">
                  {roundWinners.length}/{round.count}명
                </span>
              )}
            </div>
          );
        })}

        <AdminSubNav />
      </div>
    </div>
  );
}
