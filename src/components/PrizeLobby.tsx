"use client";

import EventBanner from "@/components/EventBanner";
import AdminSubNav from "@/components/AdminSubNav";
import { PRIZE_ROUNDS } from "@/lib/prizeRounds";
import { resolveWinnerDisplay } from "@/lib/format";
import type { ReelEntry } from "@/components/SlotReel";

type WinnerEntry = ReelEntry & { prize_rank: number | null };

// "관리하기" 화면. 5등~1등을 나란히 세로 열(컬럼)로 배치해 각 열 아래에
// 당첨자 버튼을 쌓아 보여줍니다. 아직 추첨 전인 등수는 열이 비어있습니다.
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
    <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white/60 shadow-[0_8px_40px_rgba(0,0,0,0.08)] ring-1 ring-white/60 backdrop-blur-2xl">
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
          {PRIZE_ROUNDS.map((round) => {
            const roundWinners = winners.filter((w) => w.prize_rank === round.rank);

            return (
              <div key={round.rank} className="flex flex-col gap-3 rounded-2xl bg-white/50 p-4 ring-1 ring-white/60 backdrop-blur-xl">
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#13294b] text-sm font-bold text-white">
                    {round.rank}
                  </span>
                  <span className="text-sm font-bold text-slate-900">{round.label}</span>
                  <span className="line-clamp-2 text-[11px] text-slate-500">{round.prizeName}</span>
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

        <AdminSubNav />
      </div>
    </div>
  );
}
