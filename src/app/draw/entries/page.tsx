"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MountainBackdrop } from "@/components/EventBanner";
import AdminSubNav from "@/components/AdminSubNav";
import RefreshButton from "@/components/RefreshButton";
import { getSuspiciousReason, SUSPICIOUS_REASON_LABELS } from "@/lib/moderation";
import { stripDepartmentSuffix, stripLeaderTitle } from "@/lib/format";

type Entry = {
  id: string;
  department: string;
  name: string;
  content: string;
  group_type: "draw" | "no_draw";
  is_winner: boolean;
  created_at: string;
  ai_off_topic?: boolean;
  ai_reason?: string | null;
};

function formatEntryTime(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

type Filter = "all" | "draw" | "no_draw" | "suspicious";

function isEntrySuspicious(entry: Entry): boolean {
  return getSuspiciousReason(entry.content, entry.name) !== null || entry.ai_off_topic === true;
}

export default function EntriesListPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [resettingAll, setResettingAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/entries", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.detail ?? data?.error ?? `요청 실패 (${res.status})`);
        return data;
      })
      .then((data) => {
        if (!cancelled) {
          setEntries(data.entries ?? []);
          setLoadError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/entries", { cache: "no-store" });
      const data = res.ok ? await res.json() : { entries: [] };
      setEntries(data.entries ?? []);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSeedDummy() {
    if (seeding) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/entries/seed-dummy", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(data?.error ?? "더미데이터 추가에 실패했습니다.");
        return;
      }
      window.alert(
        data.added > 0 ? `더미데이터 ${data.added}건이 추가됐습니다.` : "이미 고정 더미데이터 77개가 모두 들어있습니다."
      );
      await handleRefresh();
    } finally {
      setSeeding(false);
    }
  }

  async function handleResetAll() {
    if (resettingAll) return;
    const ok = window.confirm(
      "정말 작성카드를 전부 삭제할까요?\n\n당첨 상태뿐 아니라 접수된 카드 자체가 모두 사라지며, 되돌릴 수 없습니다.\n(테스트/리허설 준비 용도로만 사용하세요)"
    );
    if (!ok) return;

    setResettingAll(true);
    try {
      const res = await fetch("/api/admin/entries/reset-all", { method: "POST" });
      if (!res.ok) {
        window.alert("작성카드 전체 삭제에 실패했습니다.");
        return;
      }
      await handleRefresh();
    } finally {
      setResettingAll(false);
    }
  }

  async function handleDelete(entry: Entry) {
    const ok = window.confirm(`"${entry.department} ${entry.name}" 접수를 삭제할까요? 삭제하면 추첨 명단에서도 사라집니다.`);
    if (!ok) return;

    const res = await fetch(`/api/admin/entries/${entry.id}`, { method: "DELETE" });
    if (!res.ok) {
      window.alert("삭제에 실패했습니다.");
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
  }

  const filtered = useMemo(() => {
    const q = query.trim();
    return entries
      .filter((e) => {
        if (filter === "suspicious") return isEntrySuspicious(e);
        return filter === "all" || e.group_type === filter;
      })
      .filter((e) => !q || e.department.includes(q) || e.name.includes(q))
      // 당첨자 카드를 맨 위로 올립니다.
      .sort((a, b) => Number(b.is_winner) - Number(a.is_winner));
  }, [entries, filter, query]);

  const suspiciousCount = useMemo(() => entries.filter(isEntrySuspicious).length, [entries]);

  const drawCount = entries.filter((e) => e.group_type === "draw").length;
  const staffCount = entries.filter((e) => e.group_type === "no_draw").length;
  const winnerCount = entries.filter((e) => e.group_type === "draw" && e.is_winner).length;
  const remainingCount = drawCount - winnerCount;

  return (
    <main className="relative flex flex-1 flex-col items-center overflow-hidden bg-[#f5f5f7] px-4 py-8 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />
      <MountainBackdrop className="pointer-events-none absolute inset-x-0 top-0 h-40 w-full text-slate-300/40" />
      <div className="relative z-10 w-full max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/draw#main" className="text-sm text-slate-500 hover:text-slate-700">
              ← 추첨 화면으로
            </Link>
            <div className="mt-1 flex items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">작성카드보기</h1>
              <RefreshButton onClick={handleRefresh} refreshing={refreshing} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="소속 또는 이름 검색"
              className="w-full max-w-xs rounded-full border-0 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900 sm:w-64"
            />
            <button
              type="button"
              onClick={handleSeedDummy}
              disabled={seeding}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {seeding ? "추가 중..." : "더미데이터 추가"}
            </button>
            <button
              type="button"
              onClick={handleResetAll}
              disabled={resettingAll}
              className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resettingAll ? "삭제 중..." : "작성카드 전체 삭제"}
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <DashboardStat label="전체 접수" value={entries.length} />
          <DashboardStat label="지역단장 접수" value={drawCount} />
          <DashboardStat label="파트장 접수" value={staffCount} />
          <DashboardStat label="미당첨" value={remainingCount} />
          <DashboardStat label="당첨자" value={winnerCount} />
        </div>

        <div className="mb-6 flex gap-2">
          <FilterTab label="전체" active={filter === "all"} onClick={() => setFilter("all")} />
          <FilterTab label="지역단장" active={filter === "draw"} onClick={() => setFilter("draw")} />
          <FilterTab label="파트장" active={filter === "no_draw"} onClick={() => setFilter("no_draw")} />
          <FilterTab
            label={`문제카드확인 (${suspiciousCount})`}
            active={filter === "suspicious"}
            onClick={() => setFilter("suspicious")}
            danger
          />
        </div>

        {loadError && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            불러오기 실패: {loadError}
          </p>
        )}
        {loading ? (
          <p className="text-sm text-slate-500">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-500">조건에 맞는 접수 내역이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((entry) => (
              <EntryCard key={entry.id} entry={entry} onDelete={() => handleDelete(entry)} />
            ))}
          </div>
        )}

        <AdminSubNav />
      </div>
    </main>
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

function FilterTab({
  label,
  active,
  onClick,
  danger,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  danger?: boolean;
}) {
  const activeClass = danger ? "bg-pink-500 text-white" : "bg-slate-900 text-white";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium shadow-sm transition-colors ${
        active ? activeClass : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function EntryCard({ entry, onDelete }: { entry: Entry; onDelete: () => void }) {
  const heuristicReason = getSuspiciousReason(entry.content, entry.name);
  const isSuspicious = isEntrySuspicious(entry);
  const reasonLabel = heuristicReason
    ? SUSPICIOUS_REASON_LABELS[heuristicReason]
    : entry.ai_reason ?? "주제와 무관한 내용";
  const [showReason, setShowReason] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  function handleMouseEnter() {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowReason(true);
  }

  // 마우스를 떼도 바로 사라지지 않고 1초간 유지했다가 사라집니다.
  function handleMouseLeave() {
    hideTimeoutRef.current = setTimeout(() => setShowReason(false), 1000);
  }

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: "linear-gradient(180deg, #eaf2fb 0%, #cfe0f2 100%)" }}
      >
        <span className="truncate text-xs font-medium text-slate-600">
          {stripDepartmentSuffix(entry.department)}
        </span>
        <span className="flex min-w-0 items-center gap-1.5 text-sm font-bold text-slate-900">
          {isSuspicious && (
            <span
              className="relative shrink-0"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReason((v) => !v);
                }}
                aria-label="의심 사유 보기"
                className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-300 text-xs font-bold text-white"
              >
                !
              </button>
              {showReason && (
                <div className="absolute right-0 top-full z-20 mt-1.5 w-max max-w-[200px] rounded-lg bg-slate-900 px-3 py-2 text-left text-[11px] font-normal leading-relaxed text-white shadow-lg">
                  {reasonLabel}
                </div>
              )}
            </span>
          )}
          <span className="truncate">{stripLeaderTitle(entry.name)}</span>
        </span>
      </div>

      <p
        className={`min-h-24 flex-1 whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed ${
          isSuspicious ? "bg-pink-50/60 text-slate-700" : "text-slate-700"
        }`}
      >
        {entry.content}
      </p>

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2">
        <span className="text-[11px] text-slate-400">
          {entry.group_type === "draw" ? "지역단장" : "파트장"} · {formatEntryTime(entry.created_at)}
        </span>
        <div className="flex items-center gap-2">
          {entry.is_winner && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
              당첨
            </span>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="rounded-full px-2 py-0.5 text-[11px] font-medium text-red-500 hover:bg-red-50"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
