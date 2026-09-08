"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MountainBackdrop } from "@/components/EventBanner";
import AdminSubNav from "@/components/AdminSubNav";
import RefreshButton from "@/components/RefreshButton";
import { resolveWinnerDisplay } from "@/lib/format";
import { PRIZE_ROUNDS } from "@/lib/prizeRounds";

type HistoryRow = {
  id: string;
  department: string;
  name: string;
  prize_rank: number;
  won_at: string;
};

export default function WinnerHistoryPage() {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    const res = await fetch("/api/admin/winner-history", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error ?? `요청 실패 (${res.status})`);
    setHistory(data.history ?? []);
    setLoadError(null);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 최초 마운트 시 누적 기록을 불러옵니다.
    fetchHistory()
      .catch((err) => setLoadError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [fetchHistory]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetchHistory();
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    } finally {
      setRefreshing(false);
    }
  }

  const groupedByDate = useMemo(() => {
    const groups = new Map<string, HistoryRow[]>();
    for (const row of history) {
      const dateKey = new Date(row.won_at).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      });
      const list = groups.get(dateKey) ?? [];
      list.push(row);
      groups.set(dateKey, list);
    }
    return Array.from(groups.entries());
  }, [history]);

  return (
    <main className="relative flex flex-1 flex-col items-center overflow-hidden bg-[#f5f5f7] px-4 py-8 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />
      <MountainBackdrop className="pointer-events-none absolute inset-x-0 top-0 h-40 w-full text-slate-300/40" />
      <div className="relative z-10 w-full max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <div>
            <Link href="/draw/monitor" className="text-sm text-slate-500 hover:text-slate-700">
              ← 당첨자현황으로
            </Link>
            <div className="mt-1 flex items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">과거당첨기록보기</h1>
              <RefreshButton onClick={handleRefresh} refreshing={refreshing} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              초기화(리셋) 버튼을 눌러도 사라지지 않는 누적 당첨 기록입니다.
            </p>
          </div>
        </div>

        {loadError && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            불러오기 실패: {loadError}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">불러오는 중...</p>
        ) : groupedByDate.length === 0 ? (
          <p className="rounded-2xl bg-white/60 px-4 py-8 text-center text-sm text-slate-400 shadow-sm ring-1 ring-white/60">
            아직 누적된 당첨 기록이 없습니다.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {groupedByDate.map(([dateLabel, rows]) => (
              <div
                key={dateLabel}
                className="overflow-hidden rounded-2xl bg-white/60 shadow-sm ring-1 ring-white/60 backdrop-blur-xl"
              >
                <div className="px-4 py-2 text-sm font-medium text-slate-500">
                  {dateLabel} ({rows.length}명)
                </div>
                <ul className="divide-y divide-slate-100">
                  {rows.map((row) => {
                    const resolved = resolveWinnerDisplay(row.name, row.department);
                    const round = PRIZE_ROUNDS.find((r) => r.rank === row.prize_rank);
                    return (
                      <li key={row.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#13294b] text-xs font-bold text-white">
                          {row.prize_rank}
                        </span>
                        <span className="text-slate-800">
                          {resolved.department} {resolved.name}
                          {resolved.titleSuffix}
                        </span>
                        <span className="ml-auto whitespace-nowrap text-xs text-slate-400">
                          {new Date(row.won_at).toLocaleTimeString("ko-KR")}
                          {round ? ` (${round.label})` : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}

        <AdminSubNav />
      </div>
    </main>
  );
}
