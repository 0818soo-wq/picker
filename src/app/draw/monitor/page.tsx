"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MountainBackdrop } from "@/components/EventBanner";
import AdminSubNav from "@/components/AdminSubNav";
import RefreshButton from "@/components/RefreshButton";
import WrittenCardModal from "@/components/WrittenCardModal";
import { resolveWinnerDisplay } from "@/lib/format";

type Entry = {
  id: string;
  department: string;
  name: string;
  content: string;
  group_type: "draw" | "no_draw";
  is_winner: boolean;
  won_at: string | null;
  created_at: string;
};

const REFRESH_INTERVAL_MS = 5000;

export default function MonitorPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<Entry | null>(null);

  const fetchEntries = useCallback(async () => {
    const res = await fetch("/api/admin/entries", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    setEntries(data.entries ?? []);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 최초 마운트 시 현황을 불러옵니다.
    fetchEntries().finally(() => setLoading(false));
    const timer = setInterval(fetchEntries, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchEntries]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetchEntries();
    } finally {
      setRefreshing(false);
    }
  }

  const drawGroup = entries.filter((e) => e.group_type === "draw");
  const staffGroup = entries.filter((e) => e.group_type === "no_draw");
  const winners = useMemo(
    () =>
      drawGroup
        .filter((e) => e.is_winner)
        .sort((a, b) => (a.won_at ?? "").localeCompare(b.won_at ?? "")),
    [drawGroup]
  );
  const remaining = drawGroup.length - winners.length;

  // 같은 시각(won_at)에 당첨된 인원은 한 번에 뽑힌 것으로 간주해 라운드 인원수를 계산합니다.
  const roundSizeByWonAt = useMemo(() => {
    const counts = new Map<string, number>();
    for (const w of winners) {
      if (!w.won_at) continue;
      counts.set(w.won_at, (counts.get(w.won_at) ?? 0) + 1);
    }
    return counts;
  }, [winners]);

  return (
    <main className="relative flex flex-1 flex-col items-center overflow-hidden bg-[#f5f5f7] px-4 py-8 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />
      <MountainBackdrop className="pointer-events-none absolute inset-x-0 top-0 h-40 w-full text-slate-300/40" />
      <div className="relative z-10 w-full max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <div>
            <Link href="/draw#main" className="text-sm text-slate-500 hover:text-slate-700">
              ← 추첨 화면으로
            </Link>
            <div className="mt-1 flex items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">당첨자현황</h1>
              <RefreshButton onClick={handleRefresh} refreshing={refreshing} />
            </div>
          </div>
          {lastUpdated && (
            <span className="text-xs text-slate-400">
              마지막 갱신 {lastUpdated.toLocaleTimeString("ko-KR")}
            </span>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">불러오는 중...</p>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="지역단장 접수" value={drawGroup.length} />
              <Stat label="추첨 완료" value={winners.length} />
              <Stat label="추첨 대상 남음" value={remaining} />
              <Stat label="본사 파트장 접수" value={staffGroup.length} />
            </div>

            <div className="overflow-hidden rounded-2xl bg-white/60 shadow-sm ring-1 ring-white/60 backdrop-blur-xl">
              <div className="px-4 py-2 text-sm font-medium text-slate-500">당첨자 목록 ({winners.length}명)</div>
              <ul className="divide-y divide-slate-100">
                {winners.map((w, i) => {
                  const resolved = resolveWinnerDisplay(w.name, w.department);
                  return (
                    <li key={w.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedWinner(w)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") setSelectedWinner(w);
                        }}
                        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                          {i + 1}
                        </span>
                        <span className="text-slate-800">
                          {resolved.department} {resolved.name}
                          {resolved.titleSuffix}
                        </span>
                        {w.won_at && (
                          <span className="ml-auto whitespace-nowrap text-xs text-slate-400">
                            {new Date(w.won_at).toLocaleTimeString("ko-KR")} ({roundSizeByWonAt.get(w.won_at) ?? 1}명)
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
                {winners.length === 0 && (
                  <li className="px-4 py-6 text-center text-sm text-slate-400">
                    아직 추첨된 당첨자가 없습니다.
                  </li>
                )}
              </ul>
            </div>
          </>
        )}

        <AdminSubNav />
      </div>

      {selectedWinner && (() => {
        const resolved = resolveWinnerDisplay(selectedWinner.name, selectedWinner.department);
        return (
          <WrittenCardModal
            department={resolved.department}
            name={`${resolved.name}${resolved.titleSuffix}`}
            content={selectedWinner.content}
            groupLabel="지역단장"
            isWinner
            onClose={() => setSelectedWinner(null)}
          />
        );
      })()}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-white/60 py-4 shadow-sm ring-1 ring-white/60 backdrop-blur-xl">
      <span className="text-2xl font-bold text-slate-900">{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}
