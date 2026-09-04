"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import EventBanner, { CompassIcon, LightBeam, MountainBackdrop } from "@/components/EventBanner";
import SlotReel, { MultiSlotReel, type ReelEntry } from "@/components/SlotReel";
import WinnerSheet, { WinnerNameGrid } from "@/components/WinnerSheet";

type Entry = ReelEntry & { is_winner: boolean; created_at: string; group_type: "draw" | "no_draw" };
type Phase = "cover" | "landing" | "ready" | "spin" | "reveal";

export default function DrawPage() {
  const router = useRouter();
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

  const drawGroup = entries.filter((e) => e.group_type === "draw");
  const staffGroup = entries.filter((e) => e.group_type === "no_draw");
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
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
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
    setPhase("ready");
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
      {phase === "cover" && (
        <div
          className="relative isolate flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center gap-10 overflow-hidden rounded-3xl px-6 py-16 text-center shadow-xl"
          style={{ background: "linear-gradient(180deg, #eaf2fb 0%, #cfe0f2 45%, #9fb9d6 100%)" }}
        >
          <MountainBackdrop />
          <LightBeam className="absolute right-12 top-0 h-full w-1.5 opacity-80 sm:right-20" />
          <CompassIcon className="relative z-10 h-20 w-20 text-slate-700/60 sm:h-24 sm:w-24" />
          <h1 className="relative z-10 text-2xl font-extrabold leading-snug text-slate-900 sm:text-4xl">
            &lsquo;26.하 CSM전략회의 이벤트 Agent
          </h1>

          <div className="relative z-10 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleStartWithVideo}
              className="flex h-14 w-44 items-center justify-center rounded-full bg-[#13294b] text-base font-bold text-white transition-colors hover:bg-[#1c3a68]"
            >
              추첨하기
            </button>
            <button
              type="button"
              onClick={handleBackToMain}
              className="flex h-14 w-44 items-center justify-center rounded-full border border-[#13294b] bg-white/80 text-base font-bold text-[#13294b] transition-colors hover:bg-white"
            >
              관리하기
            </button>
          </div>
        </div>
      )}

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
        </div>
      )}

      {(phase === "ready" || phase === "spin") && (
        <div
          className={`w-full overflow-hidden rounded-3xl bg-white shadow-xl ${
            phase === "spin" && isMultiDraw ? "max-w-6xl" : "max-w-3xl"
          }`}
        >
          <EventBanner />

          <div className="flex flex-col gap-8 px-6 py-8 sm:px-10 sm:py-10">
            {phase === "ready" && (
              <div className="flex flex-col items-center gap-10">
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

                <div className="flex flex-col items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-500">
                    한 번에 추첨할 인원
                    <select
                      value={drawCount}
                      onChange={(e) => setDrawCount(Number(e.target.value))}
                      disabled={starting}
                      className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-800 outline-none focus:border-[#13294b]"
                    >
                      {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}명
                        </option>
                      ))}
                    </select>
                  </label>

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
        </div>
      )}

      {phase === "reveal" && roundWinners.length > 0 && (
        <div className={`flex w-full flex-col items-center gap-6 ${isMultiDraw ? "max-w-5xl" : "max-w-2xl"}`}>
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
          <button
            type="button"
            onClick={handleBackToMain}
            className="flex h-14 w-56 items-center justify-center rounded-full bg-[#13294b] text-base font-semibold text-white hover:bg-[#1c3a68]"
          >
            추첨화면으로
          </button>
        </div>
      )}

      {phase !== "cover" && phase !== "landing" && (
      <div className="mt-10 flex flex-col items-center gap-2">
        <span className="text-[10px] tracking-wide text-slate-300">
          지역단장 접수 {drawGroup.length} · 추첨 대상 {remaining.length} · 당첨자 {winners.length} · 본사 파트장 접수{" "}
          {staffGroup.length}
        </span>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-300">
          <button type="button" onClick={handleShowCover} className="hover:text-slate-500">
            대문화면가기
          </button>
          <span>·</span>
          <button type="button" onClick={handleReset} className="hover:text-slate-500">
            초기화
          </button>
          <span>·</span>
          <Link href="/draw/status" className="hover:text-slate-500">
            참여자 현황
          </Link>
          <span>·</span>
          <Link href="/draw/entries" className="hover:text-slate-500">
            접수 목록 보기
          </Link>
          <span>·</span>
          <Link href="/draw/monitor" className="hover:text-slate-500">
            실시간 현황(무음)
          </Link>
          <span>·</span>
          <button type="button" onClick={handleLogout} className="hover:text-slate-500">
            로그아웃
          </button>
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
