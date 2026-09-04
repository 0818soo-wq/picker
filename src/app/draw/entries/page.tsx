"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { isSuspiciousEntry } from "@/lib/moderation";

type Entry = {
  id: string;
  department: string;
  name: string;
  content: string;
  group_type: "draw" | "no_draw";
  is_winner: boolean;
  created_at: string;
};

type Filter = "all" | "draw" | "no_draw";

export default function EntriesListPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/entries", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { entries: [] }))
      .then((data) => {
        if (!cancelled) setEntries(data.entries ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(entry: Entry) {
    const ok = window.confirm(`"${entry.department} ${entry.name}" 접수를 삭제할까요? 삭제하면 추첨 대상에서도 제외됩니다.`);
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
      .filter((e) => filter === "all" || e.group_type === filter)
      .filter((e) => !q || e.department.includes(q) || e.name.includes(q));
  }, [entries, filter, query]);

  const drawCount = entries.filter((e) => e.group_type === "draw").length;
  const staffCount = entries.filter((e) => e.group_type === "no_draw").length;
  const winnerCount = entries.filter((e) => e.group_type === "draw" && e.is_winner).length;
  const remainingCount = drawCount - winnerCount;

  return (
    <main className="flex flex-1 flex-col items-center bg-[#f5f5f7] px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/draw#main" className="text-sm text-slate-500 hover:text-slate-700">
              ← 추첨 화면으로
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">접수 목록</h1>
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="소속 또는 이름 검색"
            className="w-full max-w-xs rounded-full border-0 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900 sm:w-64"
          />
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <DashboardStat label="전체 접수" value={entries.length} />
          <DashboardStat label="지역단장 접수" value={drawCount} />
          <DashboardStat label="파트장 접수" value={staffCount} />
          <DashboardStat label="추첨 대상" value={remainingCount} />
          <DashboardStat label="당첨자" value={winnerCount} />
        </div>

        <div className="mb-6 flex gap-2">
          <FilterTab label="전체" active={filter === "all"} onClick={() => setFilter("all")} />
          <FilterTab label="지역단장" active={filter === "draw"} onClick={() => setFilter("draw")} />
          <FilterTab label="파트장" active={filter === "no_draw"} onClick={() => setFilter("no_draw")} />
        </div>

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
      </div>
    </main>
  );
}

function DashboardStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-white py-4 shadow-sm">
      <span className="text-2xl font-bold text-slate-900">{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

function FilterTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium shadow-sm transition-colors ${
        active ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function EntryCard({ entry, onDelete }: { entry: Entry; onDelete: () => void }) {
  const suspicious = isSuspiciousEntry(entry.content);

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      {suspicious && (
        <span
          title="장난 또는 잘못된 접수로 의심됩니다. 내용을 확인해 주세요."
          className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-sm font-bold text-white shadow-md"
        >
          !
        </span>
      )}

      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: "linear-gradient(180deg, #eaf2fb 0%, #cfe0f2 100%)" }}
      >
        <span className="truncate text-xs font-medium text-slate-600">{entry.department}</span>
        <span className="truncate text-sm font-bold text-slate-900">{entry.name}</span>
      </div>

      <p
        className={`min-h-24 flex-1 whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed ${
          suspicious ? "bg-pink-50/60 text-slate-700" : "text-slate-700"
        }`}
      >
        {entry.content}
      </p>

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2">
        <span className="text-[11px] text-slate-400">
          {entry.group_type === "draw" ? "지역단장" : "파트장"}
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
