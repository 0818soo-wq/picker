"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ATTENDEES, classifyAttendeeGroup, type Attendee } from "@/lib/attendees";
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
  const regionAttendees = useMemo(
    () => attendees.filter((a) => classifyAttendeeGroup(a) === "region"),
    [attendees]
  );
  const hqAttendees = useMemo(
    () => attendees.filter((a) => classifyAttendeeGroup(a) === "hq"),
    [attendees]
  );

  return (
    <main className="relative flex flex-1 flex-col items-center overflow-hidden bg-[#f5f5f7] px-4 py-8 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />
      <div className="relative z-10 w-full max-w-6xl">
        <div className="mb-6">
          <Link href="/draw#main" className="text-sm text-slate-500 hover:text-slate-700">
            ← 추첨 화면으로
          </Link>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">참여자 현황</h1>
          <p className="mt-1 text-sm text-slate-500">{REFRESH_INTERVAL_MS / 1000}초마다 자동으로 갱신됩니다.</p>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름 / 소속 / 직책 검색"
          className="mb-8 w-full max-w-xs rounded-full border-0 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900"
        />

        {loading ? (
          <p className="text-sm text-slate-500">불러오는 중...</p>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <GroupSection
              title="지역단 (추첨 대상)"
              attendees={regionAttendees}
              submittedNames={submittedNames}
              query={query}
            />
            <GroupSection
              title="본사 스텝"
              attendees={hqAttendees}
              submittedNames={submittedNames}
              query={query}
            />
          </div>
        )}
      </div>
    </main>
  );
}

function GroupSection({
  title,
  attendees,
  submittedNames,
  query,
}: {
  title: string;
  attendees: Attendee[];
  submittedNames: Set<string>;
  query: string;
}) {
  const total = attendees.length;
  const submittedList = attendees.filter((a) => submittedNames.has(a.name));
  const pendingList = attendees.filter((a) => !submittedNames.has(a.name));
  const submittedCount = submittedList.length;
  const rate = total > 0 ? Math.round((submittedCount / total) * 100) : 0;

  const matchesQuery = (a: Attendee) =>
    !query.trim() || a.name.includes(query) || a.department.includes(query) || a.title.includes(query);
  const filteredSubmitted = submittedList.filter(matchesQuery);
  const filteredPending = pendingList.filter(matchesQuery);

  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-slate-900">{title}</h2>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <DashboardStat label="참석 예정" value={total} />
        <DashboardStat label="제출 완료" value={submittedCount} />
        <DashboardStat label="미제출" value={total - submittedCount} />
      </div>

      <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div className="h-full bg-slate-900 transition-all duration-500" style={{ width: `${rate}%` }} />
      </div>
      <p className="mb-4 text-right text-sm text-slate-500">제출률 {rate}%</p>

      <div className="mb-4 overflow-hidden rounded-2xl bg-white/60 shadow-sm ring-1 ring-white/60 backdrop-blur-xl">
        <div className="px-4 py-2 text-sm font-medium text-slate-500">
          제출 명단 ({filteredSubmitted.length}명)
        </div>
        <ul className="max-h-[40vh] divide-y divide-slate-100 overflow-y-auto">
          {filteredSubmitted.map((a, i) => (
            <li key={`${a.name}-${i}`} className="flex items-center justify-between px-4 py-2 text-sm">
              <span className="text-slate-800">
                {a.department} {a.title} {a.name}
              </span>
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
                제출
              </span>
            </li>
          ))}
          {filteredSubmitted.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-400">
              검색 결과가 없거나 아직 제출한 인원이 없습니다.
            </li>
          )}
        </ul>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white/60 shadow-sm ring-1 ring-white/60 backdrop-blur-xl">
        <div className="px-4 py-2 text-sm font-medium text-slate-500">
          미제출 명단 ({filteredPending.length}명)
        </div>
        <ul className="max-h-[40vh] divide-y divide-slate-100 overflow-y-auto">
          {filteredPending.map((a, i) => (
            <li key={`${a.name}-${i}`} className="flex items-center justify-between px-4 py-2 text-sm">
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
    </section>
  );
}

function DashboardStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-white/60 py-4 shadow-sm ring-1 ring-white/60 backdrop-blur-xl">
      <span className="text-2xl font-bold text-slate-900">{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}
