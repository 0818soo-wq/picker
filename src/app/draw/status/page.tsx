"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ATTENDEES } from "@/lib/attendees";
import { stripLeaderTitle } from "@/lib/format";

type Entry = {
  id: string;
  name: string;
  department: string;
  group_type: "draw" | "no_draw";
};

const REFRESH_INTERVAL_MS = 15000;

export default function StatusPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const fetchEntries = useCallback(async () => {
    const res = await fetch("/api/admin/entries", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    setEntries(data.entries ?? []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 최초 마운트 시 접수 목록을 불러옵니다.
    fetchEntries().finally(() => setLoading(false));
    const timer = setInterval(fetchEntries, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchEntries]);

  const submittedNames = useMemo(
    () => new Set(entries.map((e) => stripLeaderTitle(e.name))),
    [entries]
  );

  const attendees = useMemo(() => ATTENDEES.filter((a) => a.attending), []);
  const submittedCount = attendees.filter((a) => submittedNames.has(a.name)).length;
  const pendingList = attendees.filter((a) => !submittedNames.has(a.name));
  const total = attendees.length;
  const rate = total > 0 ? Math.round((submittedCount / total) * 100) : 0;

  const filteredPending = pendingList.filter(
    (a) => !query.trim() || a.name.includes(query) || a.department.includes(query) || a.title.includes(query)
  );

  return (
    <main className="flex flex-1 flex-col items-center bg-slate-100 px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-4xl">
        <div className="mb-6">
          <Link href="/draw" className="text-sm text-slate-500 hover:text-slate-700">
            ← 추첨 화면으로
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">참여자 현황</h1>
          <p className="mt-1 text-sm text-slate-500">{REFRESH_INTERVAL_MS / 1000}초마다 자동으로 갱신됩니다.</p>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <DashboardStat label="참석 예정" value={total} />
          <DashboardStat label="제출 완료" value={submittedCount} />
          <DashboardStat label="미제출" value={total - submittedCount} />
        </div>

        <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-[#13294b] transition-all duration-500"
            style={{ width: `${rate}%` }}
          />
        </div>
        <p className="mb-6 text-right text-sm text-slate-500">제출률 {rate}%</p>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름 / 소속 / 직책 검색"
          className="mb-4 w-full max-w-xs rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-[#13294b]"
        />

        {loading ? (
          <p className="text-sm text-slate-500">불러오는 중...</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
              미제출 명단 ({filteredPending.length}명)
            </div>
            <ul className="divide-y divide-slate-100">
              {filteredPending.map((a, i) => (
                <li
                  key={`${a.name}-${i}`}
                  className="flex items-center justify-between px-4 py-2 text-sm"
                >
                  <span className="text-slate-800">
                    {a.department} {a.title} {a.name}
                  </span>
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                    미제출
                  </span>
                </li>
              ))}
              {filteredPending.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-slate-400">
                  검색 결과가 없거나 전원 제출 완료했습니다.
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}

function DashboardStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-slate-200 bg-white py-4 shadow-sm">
      <span className="text-2xl font-bold text-slate-900">{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}
