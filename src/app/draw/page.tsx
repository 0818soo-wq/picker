"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const [showFingerTap, setShowFingerTap] = useState(false);
  const [autoAdvancePaused, setAutoAdvancePaused] = useState(false);

  const introRef = useRef<HTMLVideoElement>(null);
  const winRef = useRef<HTMLVideoElement>(null);
  const readyAudioRef = useRef<HTMLAudioElement>(null);
  const autoAdvancePausedRef = useRef(autoAdvancePaused);

  useEffect(() => {
    autoAdvancePausedRef.current = autoAdvancePaused;
  }, [autoAdvancePaused]);

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

  function handleIntroClick() {
    const video = introRef.current;
    if (!video || !video.paused) return;
    video.play().catch(() => {});
  }

  useEffect(() => {
    if (phase !== "ready" || autoAdvancePausedRef.current) return;
    setShowFingerTap(false);

    const triggerTap = () => {
      if (!autoAdvancePausedRef.current) setShowFingerTap(true);
    };

    // 첫 라운드에만 안내 음성을 재생하고, 재추첨부터는 바로 손가락 탭으로 넘어갑니다.
    if (drawRound > 0) {
      const timer = setTimeout(triggerTap, 800);
      return () => clearTimeout(timer);
    }

    const audio = readyAudioRef.current;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
    const safetyTimer = setTimeout(triggerTap, 20000);

    if (!audio) {
      return () => clearTimeout(safetyTimer);
    }

    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise?.catch) {
      playPromise.catch(() => {
        fallbackTimer = setTimeout(triggerTap, 3000);
      });
    }

    audio.addEventListener("ended", triggerTap);
    return () => {
      audio.removeEventListener("ended", triggerTap);
      clearTimeout(safetyTimer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [phase, drawRound]);

  async function handleStart() {
    if (starting || remaining.length === 0) return;
    setErrorMessage(null);
    setStarting(true);
    new Audio("/audio/spin.mp3").play().catch(() => {});
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

  function handleNextRound() {
    setPhase("ready");
    setWinner(null);
  }

  useEffect(() => {
    if (phase !== "reveal" || !winner) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 당첨 확정 후 최신 통계를 다시 불러옵니다.
    fetchEntries();
    const video = winRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
    }

    const text = `당첨자는 ${winner.department} ${winner.name}단장입니다. 축하합니다!`;
    let audioUrl: string | null = null;
    fetch("/api/admin/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (!blob) return;
        audioUrl = URL.createObjectURL(blob);
        new Audio(audioUrl).play().catch(() => {});
      })
      .catch(() => {});

    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [phase, winner, fetchEntries]);

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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          onClick={handleIntroClick}
        >
          <video
            ref={introRef}
            src="/videos/intro.mp4"
            className="h-full w-full object-cover"
            playsInline
            onEnded={() => setPhase("ready")}
            onError={() => setPhase("ready")}
          />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/30 text-white">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <div className="ml-1 h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-white" />
            </div>
            <p className="text-sm font-medium">화면을 클릭하면 시작합니다</p>
          </div>
        </div>
      )}

      {(phase === "ready" || phase === "spin") && (
        <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-xl">
          <EventBanner />

          <div className="flex flex-col gap-8 px-6 py-8 sm:px-10 sm:py-10">
            {phase === "ready" && (
              <div className="flex flex-col items-center gap-10">
                <audio ref={readyAudioRef} src="/audio/ready.mp3" className="hidden" />

                <div className="flex flex-col items-center gap-2 rounded-3xl border border-slate-200 bg-gradient-to-b from-blue-50 to-white px-10 py-7 shadow-sm">
                  <span className="text-sm font-medium text-slate-500">총 제출된 &lsquo;축&rsquo;의 개수</span>
                  <span className="flex items-baseline gap-1 text-5xl font-extrabold text-[#13294b]">
                    {entries.length}
                    <span className="text-xl font-semibold text-slate-400">개</span>
                  </span>
                </div>

                {errorMessage && (
                  <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{errorMessage}</p>
                )}

                <div className="relative">
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

                  {showFingerTap && (
                    <FingerTap
                      onComplete={() => {
                        setShowFingerTap(false);
                        handleStart();
                      }}
                    />
                  )}
                </div>

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
            muted
            onError={(e) => {
              (e.currentTarget as HTMLVideoElement).style.display = "none";
            }}
          />
          <WinnerSheet department={winner.department} name={winner.name} content={winner.content} />
          <button
            type="button"
            onClick={handleNextRound}
            aria-label="다음 추첨"
            title="다음 추첨"
            className="h-3 w-3 rounded-full bg-blue-600 transition-transform hover:scale-125"
          />
        </div>
      )}

      <div className="mt-10 flex flex-col items-center gap-2">
        <span className="text-[10px] tracking-wide text-slate-300">
          지역단장 접수 {drawGroup.length} · 추첨 대상 {remaining.length} · 당첨자 {winners.length} · 본사 파트장 접수{" "}
          {staffGroup.length}
        </span>
        <div className="flex items-center gap-3 text-xs text-slate-300">
          <Link href="/draw/entries" className="hover:text-slate-500">
            접수 목록 보기
          </Link>
          <span>·</span>
          <button type="button" onClick={handleReset} className="hover:text-slate-500">
            초기화
          </button>
          <span>·</span>
          <button type="button" onClick={handleLogout} className="hover:text-slate-500">
            로그아웃
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => setAutoAdvancePaused((v) => !v)}
            aria-label={autoAdvancePaused ? "자동 진행 재개" : "자동 진행 정지"}
            title={autoAdvancePaused ? "자동 진행 재개" : "자동 진행 정지"}
            className="h-2.5 w-2.5 rounded-full bg-red-500 transition-transform hover:scale-125"
            style={{ opacity: autoAdvancePaused ? 0.4 : 1 }}
          />
        </div>
      </div>
    </main>
  );
}

function FingerTap({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.img
      src="/images/finger.png"
      alt=""
      className="pointer-events-none absolute -right-6 -top-28 h-40 w-40 origin-bottom-right select-none drop-shadow-xl"
      initial={{ opacity: 0, y: -40, rotate: -6 }}
      animate={{ opacity: [0, 1, 1, 1], y: [-40, -40, 4, -16], rotate: [-6, -6, -2, -6] }}
      transition={{ duration: 1, times: [0, 0.25, 0.55, 1], ease: "easeOut" }}
      onAnimationComplete={onComplete}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
