"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import EventBanner, { MountainBackdrop, SailboatIcon } from "@/components/EventBanner";
import SlotReel, { MultiSlotReel, type ReelEntry } from "@/components/SlotReel";
import WinnerSheet, { WinnerNameGrid } from "@/components/WinnerSheet";
import Confetti from "@/components/Confetti";

// 애플 느낌의 부드러운 전환에 쓰는 이징/트랜지션 프리셋입니다.
const APPLE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.5, ease: APPLE_EASE },
};

type Entry = ReelEntry & { is_winner: boolean; created_at: string; group_type: "draw" | "no_draw" };
type Phase = "cover" | "landing" | "ready" | "spin" | "reveal";

export default function DrawPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("cover");
  const [roundWinners, setRoundWinners] = useState<ReelEntry[]>([]);
  const [pool, setPool] = useState<ReelEntry[]>([]);
  const [drawRound, setDrawRound] = useState(0);
  const [drawCount, setDrawCount] = useState(1);
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 다른 화면에서 #main으로 돌아오면 대문화면을 건너뜁니다.
    if (window.location.hash === "#main") setPhase("ready");
  }, []);

  const drawGroup = entries.filter((e) => e.group_type === "draw");
  const remaining = drawGroup.filter((e) => !e.is_winner);
  const winners = drawGroup.filter((e) => e.is_winner);
  const isMultiDraw = roundWinners.length > 1;

  function handleIntroClick() {
    const video = introRef.current;
    if (!video || !video.paused) return;
    video.play().catch(() => {});
  }

  useEffect(() => {
    if (phase !== "landing") return;
    const video = introRef.current;
    if (video) video.currentTime = 0;
  }, [phase]);

  // 사장님 영상 화면 → 메인화면으로 넘어갈 때만 나오는 안내 음성입니다.
  // 영상이 재생되는 동안 미리 받아둬서, 실제 전환 시점에는 지연 없이 바로 재생됩니다.
  const readyAnnounceRef = useRef<{ url: string; audio: HTMLAudioElement } | null>(null);
  const READY_ANNOUNCE_TEXT =
    "여러분이 아까 작성해준 '축의 전환' 내용을 랜덤으로 뽑아보겠습니다. 추첨을 시작할까요?";
  const READY_ANNOUNCE_RATE = 1;

  useEffect(() => {
    if (phase !== "landing") return;
    let cancelled = false;
    fetch("/api/admin/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: READY_ANNOUNCE_TEXT }),
    })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (cancelled || !blob) return;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.preload = "auto";
        audio.playbackRate = READY_ANNOUNCE_RATE;
        readyAnnounceRef.current = { url, audio };
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (readyAnnounceRef.current) {
        URL.revokeObjectURL(readyAnnounceRef.current.url);
        readyAnnounceRef.current = null;
      }
    };
  }, [phase]);

  function handleGoToMainFromVideo() {
    setPhase("ready");
    const prepared = readyAnnounceRef.current;
    if (prepared) {
      prepared.audio.currentTime = 0;
      prepared.audio.play().catch(() => {});
      return;
    }
    // 폴백: 아직 준비되지 않았다면 그 자리에서 요청해 재생합니다.
    fetch("/api/admin/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: READY_ANNOUNCE_TEXT }),
    })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (!blob) return;
        const audio = new Audio(URL.createObjectURL(blob));
        audio.playbackRate = READY_ANNOUNCE_RATE;
        audio.play().catch(() => {});
      })
      .catch(() => {});
  }

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

      const res = await fetch("/api/admin/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: drawCount }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMessage(data?.error ?? "추첨에 실패했습니다.");
        setStarting(false);
        return;
      }

      const drawnWinners = (data.winners ?? []) as ReelEntry[];
      if (drawnWinners.length === 0) {
        setErrorMessage("추첨에 실패했습니다.");
        setStarting(false);
        return;
      }

      setRoundWinners(drawnWinners);
      setPool(currentPool);
      setDrawRound((r) => r + 1);
      setPhase("spin");
    } catch {
      setErrorMessage("네트워크 오류가 발생했습니다.");
    } finally {
      setStarting(false);
    }
  }

  function handleBackToMain() {
    setPhase("ready");
    setRoundWinners([]);
  }

  function handleShowCover() {
    setPhase("cover");
  }

  function handleStartWithVideo() {
    setPhase("landing");
  }

  function handleSkipIntro() {
    const video = introRef.current;
    if (video) video.pause();
    handleGoToMainFromVideo();
  }

  useEffect(() => {
    if (phase !== "reveal" || roundWinners.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 당첨 확정 후 최신 통계를 다시 불러옵니다.
    fetchEntries();
    const video = winRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  }, [phase, roundWinners, fetchEntries]);

  async function handleReset() {
    if (!window.confirm("초기화 하시겠습니까?")) return;
    await fetch("/api/admin/reset", { method: "POST" });
    await fetchEntries();
  }

  return (
    <main className="relative flex flex-1 flex-col items-center overflow-hidden bg-[#f5f5f7] px-4 py-8 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-slate-300/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />

      {phase !== "cover" && phase !== "landing" && (
        <motion.button
          type="button"
          onClick={handleReset}
          aria-label="초기화"
          title="초기화"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="fixed right-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-slate-400 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-slate-600"
        >
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 9A8 8 0 1 1 4 13"
            />
          </svg>
        </motion.button>
      )}

      <AnimatePresence mode="wait">
      {phase === "cover" && (
        <motion.div
          key="cover"
          {...fadeUp}
          className="relative flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center gap-12 overflow-hidden px-6 py-16 text-center"
        >
          <MountainBackdrop className="absolute inset-x-0 bottom-0 h-1/2 w-full text-slate-300/50" />

          <SailboatIcon className="relative z-10 h-10 w-10 text-slate-900 sm:h-12 sm:w-12" />
          <h1 className="relative z-10 flex flex-col items-center gap-3 font-paperlogy">
            <span className="text-base font-medium tracking-wide text-slate-500 sm:text-xl">
              &lsquo;26.하 CSM전략회의 이벤트
            </span>
            <span className="text-5xl font-black leading-none tracking-tighter text-slate-900 sm:text-8xl">
              AI 당첨자 추첨 <span className="text-blue-600">Agent</span>
            </span>
          </h1>

          <div className="relative z-10 flex flex-wrap items-center justify-center gap-3">
            <motion.button
              type="button"
              onClick={handleStartWithVideo}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2, ease: APPLE_EASE }}
              className="flex h-12 w-40 items-center justify-center rounded-full bg-slate-900 text-base font-semibold text-white shadow-sm"
            >
              추첨하기
            </motion.button>
            <motion.button
              type="button"
              onClick={handleBackToMain}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2, ease: APPLE_EASE }}
              className="flex h-12 w-40 items-center justify-center rounded-full bg-white text-base font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200"
            >
              관리하기
            </motion.button>
          </div>
        </motion.div>
      )}

      {phase === "landing" && (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: APPLE_EASE }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          onClick={handleIntroClick}
        >
          <video
            ref={introRef}
            src="/videos/intro.mp4"
            className="h-full w-full object-cover"
            playsInline
            onEnded={handleGoToMainFromVideo}
            onError={() => setPhase("ready")}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSkipIntro();
            }}
            className="absolute bottom-6 right-6 z-10 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/50 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white/80"
          >
            스킵
          </button>
        </motion.div>
      )}

      {(phase === "ready" || phase === "spin") && (
        <motion.div
          key="main"
          {...fadeUp}
          className={`relative w-full overflow-hidden rounded-3xl bg-white/60 shadow-[0_8px_40px_rgba(0,0,0,0.08)] ring-1 ring-white/60 backdrop-blur-2xl ${
            phase === "spin" && isMultiDraw ? "max-w-6xl" : "max-w-3xl"
          }`}
        >
          <EventBanner />

          <div className="flex flex-col gap-8 px-6 py-8 sm:px-10 sm:py-10">
            {phase === "ready" && (
              <div className="flex flex-col items-center gap-10">
                <div className="flex flex-col items-center gap-2 rounded-3xl bg-white/50 px-10 py-7 shadow-sm ring-1 ring-white/60 backdrop-blur-xl">
                  <span className="text-sm font-medium text-slate-500">총 제출된 &lsquo;축&rsquo;의 개수</span>
                  <span className="flex items-baseline gap-1 text-5xl font-extrabold text-slate-900">
                    {entries.length}
                    <span className="text-xl font-semibold text-slate-400">개</span>
                  </span>
                </div>

                {errorMessage && (
                  <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{errorMessage}</p>
                )}

                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm text-slate-500">한 번에 추첨할 인원</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                      <motion.button
                        key={n}
                        type="button"
                        onClick={() => setDrawCount(n)}
                        disabled={starting}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        transition={{ duration: 0.15, ease: APPLE_EASE }}
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          drawCount === n
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {n}
                      </motion.button>
                    ))}
                  </div>

                  <motion.button
                    type="button"
                    onClick={handleStart}
                    disabled={starting || entriesLoading || remaining.length === 0}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex h-16 w-64 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white shadow-sm transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {entriesLoading
                      ? "불러오는 중..."
                      : remaining.length === 0
                        ? "추첨 대상 없음"
                        : starting
                          ? "준비 중..."
                          : "추첨 시작"}
                  </motion.button>
                </div>

                {winners.length > 0 && (
                  <div className="w-full max-w-xl">
                    <h2 className="mb-3 text-sm font-medium text-slate-500">당첨자 목록</h2>
                    <ul className="flex flex-col gap-2">
                      {winners.map((w) => (
                        <li
                          key={w.id}
                          className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3"
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

            {phase === "spin" && roundWinners.length > 0 && (
              <div className="flex flex-col items-center gap-4">
                <p className="text-lg font-medium text-blue-600">추첨 중...</p>
                {roundWinners.length === 1 ? (
                  <SlotReel
                    key={drawRound}
                    pool={pool}
                    winner={roundWinners[0]}
                    onSettle={() => setPhase("reveal")}
                  />
                ) : (
                  <MultiSlotReel
                    key={drawRound}
                    pool={pool}
                    winners={roundWinners}
                    onAllSettled={() => setPhase("reveal")}
                  />
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {phase === "reveal" && roundWinners.length > 0 && (
        <motion.div
          key="reveal"
          {...fadeUp}
          className={`flex w-full flex-col items-center gap-6 ${isMultiDraw ? "max-w-5xl" : "max-w-2xl"}`}
        >
          <Confetti />
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
          {roundWinners.length === 1 ? (
            <WinnerSheet
              department={roundWinners[0].department}
              name={roundWinners[0].name}
              content={roundWinners[0].content}
            />
          ) : (
            <WinnerNameGrid winners={roundWinners} />
          )}
          <motion.button
            type="button"
            onClick={handleBackToMain}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex h-14 w-56 items-center justify-center rounded-full bg-slate-900 text-base font-semibold text-white shadow-sm hover:bg-slate-700"
          >
            추첨화면으로
          </motion.button>
        </motion.div>
      )}
      </AnimatePresence>

      {phase !== "cover" && phase !== "landing" && (
      <div className="mt-10 flex flex-col items-center gap-2">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-300">
          <button type="button" onClick={handleShowCover} className="hover:text-slate-500">
            대문화면가기
          </button>
          <span>·</span>
          <Link href="/draw/status" className="hover:text-slate-500">
            작성자현황
          </Link>
          <span>·</span>
          <Link href="/draw/entries" className="hover:text-slate-500">
            작성카드보기
          </Link>
          <span>·</span>
          <Link href="/draw/monitor" className="hover:text-slate-500">
            당첨자현황
          </Link>
        </div>
        {phase !== "ready" && (
          <button type="button" onClick={handleBackToMain} className="text-xs text-slate-300 hover:text-slate-500">
            메인화면가기
          </button>
        )}
      </div>
      )}
    </main>
  );
}
