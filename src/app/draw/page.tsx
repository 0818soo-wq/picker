"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import EventBanner from "@/components/EventBanner";
import SlotReel, { type ReelEntry } from "@/components/SlotReel";
import WinnerSheet from "@/components/WinnerSheet";

type Entry = ReelEntry & { is_winner: boolean; created_at: string; group_type: "draw" | "no_draw" };
type Phase = "landing" | "ready" | "spin" | "reveal";

export default function DrawPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("landing");
  const [winner, setWinner] = useState<ReelEntry | null>(null);
  const [pool, setPool] = useState<ReelEntry[]>([]);
  const [drawRound, setDrawRound] = useState(0);
  const [starting, setStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const introRef = useRef<HTMLVideoElement>(null);
  const winRef = useRef<HTMLVideoElement>(null);

  const fetchEntries = useCallback(async () => {
    const res = await fetch("/api/admin/entries", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    setEntries(data.entries ?? []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 최초 마운트 시 접수 목록을 불러옵니다.
    fetchEntries().finally(() => setEntriesLoading(false));
  }, [fetchEntries]);

  const drawGroup = entries.filter((e) => e.group_type === "draw");
  const staffGroup = entries.filter((e) => e.group_type === "no_draw");
  const remaining = drawGroup.filter((e) => !e.is_winner);
  const winners = drawGroup.filter((e) => e.is_winner);

  useEffect(() => {
    if (phase !== "landing") return;
    const video = introRef.current;
    const goNext = () => setPhase("ready");

    if (!video) {
      goNext();
      return;
    }

    video.currentTime = 0;
    const playPromise = video.play();
    if (playPromise?.catch) playPromise.catch(() => goNext());

    const fallback = setTimeout(goNext, 15000);
    video.addEventListener("ended", goNext);
    return () => {
      video.removeEventListener("ended", goNext);
      clearTimeout(fallback);
    };
  }, [phase]);

  async function handleStart() {
    if (starting || remaining.length === 0) return;
    setErrorMessage(null);
    setStarting(true);
    try {
      const currentPool = remaining.map(({ id, department, name, content }) => ({
        id,
        department,
        name,
        content,
      }));

      const res = await fetch("/api/admin/draw", { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMessage(data?.error ?? "추첨에 실패했습니다.");
        setStarting(false);
        return;
      }

      setWinner(data.winner);
      setPool(currentPool);
      setDrawRound((r) => r + 1);
      setPhase("spin");
    } catch {
      setErrorMessage("네트워크 오류가 발생했습니다.");
    } finally {
      setStarting(false);
    }
  }

  useEffect(() => {
    if (phase !== "reveal") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 당첨 확정 후 최신 통계를 다시 불러옵니다.
    fetchEntries();
    const video = winRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  }, [phase, fetchEntries]);

  function handleNextRound() {
    setPhase("ready");
    setWinner(null);
  }

  async function handleReset() {
    if (!window.confirm("모든 당첨 기록을 초기화할까요? 리허설/테스트 용도로만 사용하세요.")) return;
    await fetch("/api/admin/reset", { method: "POST" });
    await fetchEntries();
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin-login");
  }

  return (
    <main className="flex flex-1 flex-col items-center bg-slate-100 px-4 py-8 sm:px-6 sm:py-12">
      {phase === "landing" && (
        <div className="flex flex-1 items-center justify-center py-4">
          <video
            ref={introRef}
            src="/videos/intro.mp4"
            className="max-h-[70vh] w-full max-w-2xl rounded-2xl border border-slate-200 bg-white"
            playsInline
            onError={() => setPhase("ready")}
          />
        </div>
      )}

      {(phase === "ready" || phase === "spin") && (
        <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-xl">
          <EventBanner />

          <div className="flex flex-col gap-8 px-6 py-8 sm:px-10 sm:py-10">
            {phase === "ready" && (
              <div className="flex flex-col items-center gap-10">
                <div className="flex flex-wrap justify-center gap-8 text-center">
                  <Stat label="지역단장 접수" value={drawGroup.length} />
                  <Stat label="추첨 대상" value={remaining.length} />
                  <Stat label="당첨자" value={winners.length} />
                  <Stat label="본사 파트장 접수" value={staffGroup.length} />
                </div>

                {errorMessage && (
                  <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{errorMessage}</p>
                )}

                <motion.button
                  type="button"
                  onClick={handleStart}
                  disabled={starting || entriesLoading || remaining.length === 0}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex h-16 w-64 items-center justify-center rounded-full bg-[#13294b] text-lg font-bold text-white transition-colors hover:bg-[#1c3a68] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {entriesLoading
                    ? "불러오는 중..."
                    : remaining.length === 0
                      ? "추첨 대상 없음"
                      : starting
                        ? "준비 중..."
                        : "추첨 시작"}
                </motion.button>

                {winners.length > 0 && (
                  <div className="w-full max-w-xl">
                    <h2 className="mb-3 text-sm font-medium text-slate-500">당첨자 목록</h2>
                    <ul className="flex flex-col gap-2">
                      {winners.map((w) => (
                        <li
                          key={w.id}
                          className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <span className="text-sm text-slate-800">
                            {w.department} · {w.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-full border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-800"
                >
                  초기화
                </button>
              </div>
            )}

            {phase === "spin" && winner && (
              <div className="flex flex-col items-center gap-4">
                <p className="text-lg font-medium text-blue-600">추첨 중...</p>
                <SlotReel key={drawRound} pool={pool} winner={winner} onSettle={() => setPhase("reveal")} />
              </div>
            )}
          </div>
        </div>
      )}

      {phase === "reveal" && winner && (
        <div className="flex w-full max-w-2xl flex-col items-center gap-6">
          <video
            ref={winRef}
            src="/videos/win.mp4"
            className="max-h-[40vh] w-full max-w-md rounded-2xl border border-slate-200 bg-white"
            playsInline
            onError={(e) => {
              (e.currentTarget as HTMLVideoElement).style.display = "none";
            }}
          />
          <WinnerSheet department={winner.department} name={winner.name} content={winner.content} />
          <button
            type="button"
            onClick={handleNextRound}
            className="flex h-14 w-56 items-center justify-center rounded-full bg-[#13294b] text-base font-semibold text-white hover:bg-[#1c3a68]"
          >
            다음 추첨
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleLogout}
        className="mt-10 text-sm text-slate-400 hover:text-slate-600"
      >
        로그아웃
      </button>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-3xl font-bold text-slate-900">{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}
