"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SlotReel, { type ReelEntry } from "@/components/SlotReel";

type Entry = ReelEntry & { is_winner: boolean; created_at: string; group_type: "draw" | "no_draw" };
type Phase = "idle" | "intro" | "spin" | "reveal";

export default function DrawPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("idle");
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
    fetchEntries().finally(() => setLoading(false));
  }, [fetchEntries]);

  const drawGroup = entries.filter((e) => e.group_type === "draw");
  const staffGroup = entries.filter((e) => e.group_type === "no_draw");
  const remaining = drawGroup.filter((e) => !e.is_winner);
  const winners = drawGroup.filter((e) => e.is_winner);

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
      setPhase("intro");
    } catch {
      setErrorMessage("네트워크 오류가 발생했습니다.");
    } finally {
      setStarting(false);
    }
  }

  useEffect(() => {
    if (phase !== "intro") return;
    const video = introRef.current;
    const goNext = () => setPhase("spin");

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
    setPhase("idle");
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

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-black text-zinc-400">
        불러오는 중...
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col bg-black px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-bold">조직 전환 추첨 이벤트</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            로그아웃
          </button>
        </header>

        {phase === "idle" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-10">
            <div className="flex flex-wrap justify-center gap-8 text-center">
              <Stat label="지역단장 접수" value={drawGroup.length} />
              <Stat label="추첨 대상" value={remaining.length} />
              <Stat label="당첨자" value={winners.length} />
              <Stat label="본사 파트장 접수" value={staffGroup.length} />
            </div>

            {errorMessage && (
              <p className="rounded-lg bg-red-950 px-4 py-2 text-sm text-red-300">{errorMessage}</p>
            )}

            <button
              type="button"
              onClick={handleStart}
              disabled={starting || remaining.length === 0}
              className="flex h-16 w-64 items-center justify-center rounded-full bg-yellow-400 text-lg font-bold text-black transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {remaining.length === 0 ? "추첨 대상 없음" : starting ? "준비 중..." : "추첨 시작"}
            </button>

            {winners.length > 0 && (
              <div className="w-full max-w-xl">
                <h2 className="mb-3 text-sm font-medium text-zinc-400">당첨자 목록</h2>
                <ul className="flex flex-col gap-2">
                  {winners.map((w) => (
                    <li
                      key={w.id}
                      className="flex items-center gap-3 rounded-lg bg-zinc-900 px-4 py-3"
                    >
                      <span className="text-sm">
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
              className="text-xs text-zinc-600 hover:text-zinc-400"
            >
              당첨 기록 초기화 (리허설용)
            </button>
          </div>
        )}

        {phase === "intro" && (
          <div className="flex flex-1 items-center justify-center">
            <video
              ref={introRef}
              src="/videos/intro.mp4"
              className="max-h-[70vh] w-full max-w-2xl rounded-2xl bg-zinc-900"
              playsInline
              onError={() => setPhase("spin")}
            />
          </div>
        )}

        {phase === "spin" && winner && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <p className="text-lg font-medium text-yellow-400">추첨 중...</p>
            <SlotReel key={drawRound} pool={pool} winner={winner} onSettle={() => setPhase("reveal")} />
          </div>
        )}

        {phase === "reveal" && winner && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <video
              ref={winRef}
              src="/videos/win.mp4"
              className="max-h-[40vh] w-full max-w-md rounded-2xl bg-zinc-900"
              playsInline
              onError={(e) => {
                (e.currentTarget as HTMLVideoElement).style.display = "none";
              }}
            />
            <div className="flex w-full max-w-lg flex-col items-center gap-3 text-center">
              <p className="text-xl font-semibold text-yellow-400">🎉 당첨을 축하합니다 🎉</p>
              <p className="text-2xl font-bold">
                {winner.department} · {winner.name}
              </p>
              <p className="max-h-40 w-full overflow-y-auto whitespace-pre-wrap rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-sm leading-relaxed text-zinc-200">
                {winner.content}
              </p>
            </div>
            <button
              type="button"
              onClick={handleNextRound}
              className="flex h-14 w-56 items-center justify-center rounded-full bg-white text-base font-semibold text-black hover:bg-zinc-200"
            >
              다음 추첨
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-3xl font-bold">{value}</span>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  );
}
