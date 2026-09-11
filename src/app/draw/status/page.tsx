"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MountainBackdrop } from "@/components/EventBanner";
import AdminSubNav from "@/components/AdminSubNav";
import RefreshButton from "@/components/RefreshButton";
import WrittenCardModal from "@/components/WrittenCardModal";
import {
  ATTENDEES,
  classifyAttendeeGroup,
  displayDepartment,
  findAttendeeByName,
  findAttendeeByNameAndDepartment,
  type Attendee,
} from "@/lib/attendees";
import { stripLeaderTitle } from "@/lib/format";
import { getSuspiciousReason } from "@/lib/moderation";
import { PRIZE_ROUNDS } from "@/lib/prizeRounds";

type Entry = {
  id: string;
  name: string;
  department: string;
  content: string;
  group_type: "draw" | "no_draw";
  is_winner: boolean;
  created_at: string;
  ai_off_topic?: boolean | null;
};

function isEntrySuspicious(entry: Entry): boolean {
  return getSuspiciousReason(entry.content, entry.name) !== null || entry.ai_off_topic === true;
}

// 추첨을 진행하려면 최소 이만큼의 "유효한"(오탈자/성의없는 내용 등 무효표 제외)
// 지역단장 접수가 있어야 합니다. 등수별 추첨 인원(5등~1등)의 합계로 계산합니다.
const MIN_VALID_ENTRIES = PRIZE_ROUNDS.reduce((sum, round) => sum + round.count, 0);

function formatEntryTime(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

const REFRESH_INTERVAL_MS = 15000;

export default function StatusPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

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

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetchEntries();
    } finally {
      setRefreshing(false);
    }
  }

  const submittedNames = useMemo(
    () => new Set(entries.map((e) => stripLeaderTitle(e.name))),
    [entries]
  );
  // 이름을 눌렀을 때 작성한 카드를 바로 찾아 보여주기 위한 매핑입니다.
  const entryByName = useMemo(
    () => new Map(entries.map((e) => [stripLeaderTitle(e.name), e])),
    [entries]
  );

  // "no_draw" 접수 중, 명단(ATTENDEES)에서 실제로 찾아지는 사람은 본사파트장 접수로,
  // 명단에 없어 화면에서 소속/이름을 직접 입력한 경우는 기타 접수로 구분합니다.
  const isKnownAttendeeEntry = useCallback((entry: Entry): boolean => {
    return Boolean(
      findAttendeeByNameAndDepartment(entry.name, entry.department) ?? findAttendeeByName(entry.name)
    );
  }, []);

  const drawCount = useMemo(() => entries.filter((e) => e.group_type === "draw").length, [entries]);
  const staffCount = useMemo(
    () => entries.filter((e) => e.group_type === "no_draw" && isKnownAttendeeEntry(e)).length,
    [entries, isKnownAttendeeEntry]
  );
  const otherCount = useMemo(
    () => entries.filter((e) => e.group_type === "no_draw" && !isKnownAttendeeEntry(e)).length,
    [entries, isKnownAttendeeEntry]
  );
  const winnerCount = useMemo(
    () => entries.filter((e) => e.group_type === "draw" && e.is_winner).length,
    [entries]
  );
  const remainingCount = drawCount - winnerCount;
  const validDrawCount = useMemo(
    () => entries.filter((e) => e.group_type === "draw" && !isEntrySuspicious(e)).length,
    [entries]
  );
  const minReached = validDrawCount >= MIN_VALID_ENTRIES;

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
      <MountainBackdrop className="pointer-events-none absolute inset-x-0 top-0 h-40 w-full text-slate-300/40" />
      <div className="relative z-10 w-full max-w-6xl">
        <div className="mb-6">
          <Link href="/draw#main" className="text-sm text-slate-500 hover:text-slate-700">
            ← 추첨 화면으로
          </Link>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">작성자현황</h1>
            <RefreshButton onClick={handleRefresh} refreshing={refreshing} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{REFRESH_INTERVAL_MS / 1000}초마다 자동으로 갱신됩니다.</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-7">
          <DashboardStat label="전체 접수" value={entries.length} />
          <DashboardStat label="지역단장 접수" value={drawCount} />
          <DashboardStat label="본사파트장 접수" value={staffCount} />
          <DashboardStat label="기타 접수" value={otherCount} />
          <DashboardStat
            label={`유효 접수 (최소 ${MIN_VALID_ENTRIES}명/문제카드제외)`}
            value={validDrawCount}
            badge={minReached ? "최소인원 달성" : undefined}
          />
          <DashboardStat label="당첨자" value={winnerCount} />
          <DashboardStat label="미당첨자" value={remainingCount} />
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
              title="지역단"
              attendees={regionAttendees}
              submittedNames={submittedNames}
              entryByName={entryByName}
              onSelectEntry={setSelectedEntry}
              query={query}
            />
            <GroupSection
              title="본사 스텝"
              attendees={hqAttendees}
              submittedNames={submittedNames}
              entryByName={entryByName}
              onSelectEntry={setSelectedEntry}
              query={query}
            />
          </div>
        )}

        <AdminSubNav />
      </div>

      {selectedEntry && (
        <WrittenCardModal
          department={selectedEntry.department}
          name={stripLeaderTitle(selectedEntry.name)}
          content={selectedEntry.content}
          groupLabel={selectedEntry.group_type === "draw" ? "지역단장" : "파트장"}
          isWinner={selectedEntry.is_winner}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </main>
  );
}

function GroupSection({
  title,
  attendees,
  submittedNames,
  entryByName,
  onSelectEntry,
  query,
}: {
  title: string;
  attendees: Attendee[];
  submittedNames: Set<string>;
  entryByName: Map<string, Entry>;
  onSelectEntry: (entry: Entry) => void;
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
          {filteredSubmitted.map((a, i) => {
            const entry = entryByName.get(a.name);
            return (
              <li key={`${a.name}-${i}`}>
                <button
                  type="button"
                  onClick={() => entry && onSelectEntry(entry)}
                  disabled={!entry}
                  className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-slate-50 disabled:cursor-default disabled:hover:bg-transparent"
                >
                  <span className="text-slate-800">
                    {displayDepartment(a.team, a.department)} {a.title} {a.name}
                  </span>
                  <span className="flex items-center gap-2">
                    {entry && (
                      <span className="text-xs text-slate-400">{formatEntryTime(entry.created_at)}</span>
                    )}
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
                      제출
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
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
                {displayDepartment(a.team, a.department)} {a.title} {a.name}
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

function DashboardStat({ label, value, badge }: { label: string; value: number; badge?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-white/60 py-4 shadow-sm ring-1 ring-white/60 backdrop-blur-xl">
      <span className="flex items-center gap-1.5">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        {badge && <span className="text-[10px] font-bold text-red-500">{badge}</span>}
      </span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}
