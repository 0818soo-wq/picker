"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MountainBackdrop } from "@/components/EventBanner";
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

  // 당첨자별 축하 음성을 미리 받아둡니다. 클릭 시점에 바로 fetch부터 하면
  // 재생이 사용자 클릭과 비동기로 분리되어 일부 브라우저(사파리 등)의
  // 자동재생 정책에 막힐 수 있어, 당첨자가 뜨는 즉시 미리 준비해둡니다.
  const announceCacheRef = useRef<Map<string, { url: string; audio: HTMLAudioElement }>>(new Map());

  const announceTextFor = useCallback((w: Entry) => {
    const resolved = resolveWinnerDisplay(w.name, w.department);
    return `축하합니다 ${resolved.department} ${resolved.name}${resolved.titleSuffix}!`;
  }, []);

  useEffect(() => {
    const cache = announceCacheRef.current;
    for (const w of winners) {
      if (cache.has(w.id)) continue;
      fetch("/api/admin/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: announceTextFor(w) }),
      })
        .then(async (res) => {
          if (!res.ok) {
            console.error("[monitor] 음성 준비 실패", res.status, await res.text().catch(() => ""));
            return null;
          }
          return res.blob();
        })
        .then((blob) => {
          if (!blob || cache.has(w.id)) return;
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.preload = "auto";
          cache.set(w.id, { url, audio });
        })
        .catch((err) => console.error("[monitor] 음성 준비 중 오류", err));
    }
  }, [winners, announceTextFor]);

  useEffect(() => {
    const cache = announceCacheRef.current;
    return () => {
      cache.forEach(({ url }) => URL.revokeObjectURL(url));
      cache.clear();
    };
  }, []);

  function handleAnnounceWinner(w: Entry) {
    const prepared = announceCacheRef.current.get(w.id);
    if (prepared) {
      prepared.audio.currentTime = 0;
      prepared.audio.play().catch((err) => {
        console.error("[monitor] 음성 재생 실패", err);
        window.alert("음성 재생에 실패했습니다. 다시 눌러 주세요.");
      });
      return;
    }
    // 폴백: 아직 준비되지 않았다면 그 자리에서 요청해 재생합니다.
    fetch("/api/admin/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: announceTextFor(w) }),
    })
      .then(async (res) => {
        if (!res.ok) {
          console.error("[monitor] 음성 생성 실패", res.status, await res.text().catch(() => ""));
          window.alert("음성 생성에 실패했습니다.");
          return null;
        }
        return res.blob();
      })
      .then((blob) => {
        if (!blob) return;
        new Audio(URL.createObjectURL(blob)).play().catch((err) => {
          console.error("[monitor] 음성 재생 실패", err);
          window.alert("음성 재생에 실패했습니다. 다시 눌러 주세요.");
        });
      })
      .catch((err) => {
        console.error("[monitor] 음성 요청 중 오류", err);
        window.alert("네트워크 오류로 음성을 재생할 수 없습니다.");
      });
  }

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
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              실시간 추첨 현황 (관리용)
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              소리와 영상 없이 진행 상황만 확인하는 화면입니다. {REFRESH_INTERVAL_MS / 1000}초마다 자동 갱신됩니다.
            </p>
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
              <div className="px-4 py-2 text-sm font-medium text-slate-500">
                당첨자 목록 ({winners.length}명) · 스피커 버튼을 누르면 사장님 목소리로 축하 인사를 들려드려요
              </div>
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnnounceWinner(w);
                          }}
                          aria-label="사장님 목소리로 축하 인사 듣기"
                          title="사장님 목소리로 축하 인사 듣기"
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/40 text-slate-400/70 backdrop-blur-sm transition-colors hover:bg-white/70 hover:text-slate-500"
                        >
                          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                            <path d="M4 9v6h4l5 5V4L8 9H4z" />
                            <path
                              d="M16.5 8.5a5 5 0 0 1 0 7"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              fill="none"
                            />
                            <path
                              d="M18.8 6.2a8.5 8.5 0 0 1 0 11.6"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              fill="none"
                              opacity="0.6"
                            />
                          </svg>
                        </button>
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
      </div>

      {selectedWinner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setSelectedWinner(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">{selectedWinner.department}</p>
                <p className="text-lg font-bold text-slate-900">{selectedWinner.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWinner(null)}
                className="rounded-full px-2 py-1 text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                닫기
              </button>
            </div>
            <p className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
              {selectedWinner.content}
            </p>
          </div>
        </div>
      )}
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
