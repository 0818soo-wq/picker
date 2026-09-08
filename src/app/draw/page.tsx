"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MountainBackdrop, SailboatIcon } from "@/components/EventBanner";
import SlotReel, { MultiSlotReel, type ReelEntry } from "@/components/SlotReel";
import PrizeIntro from "@/components/PrizeIntro";
import PrizeReveal from "@/components/PrizeReveal";
import PrizeLobby from "@/components/PrizeLobby";
import WrittenCardModal from "@/components/WrittenCardModal";
import { PRIZE_ROUNDS } from "@/lib/prizeRounds";
import { resolveWinnerDisplay } from "@/lib/format";

// 애플 느낌의 부드러운 전환에 쓰는 이징/트랜지션 프리셋입니다.
const APPLE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.5, ease: APPLE_EASE },
};

type Entry = ReelEntry & {
  is_winner: boolean;
  created_at: string;
  group_type: "draw" | "no_draw";
  prize_rank: number | null;
};
type Phase = "cover" | "lobby" | "prizeIntro" | "spin" | "reveal";

export default function DrawPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("cover");
  const [roundIndex, setRoundIndex] = useState(0);
  const [roundWinners, setRoundWinners] = useState<ReelEntry[]>([]);
  const [pool, setPool] = useState<ReelEntry[]>([]);
  const [drawRound, setDrawRound] = useState(0);
  const [starting, setStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [entriesOpen, setEntriesOpen] = useState<boolean | null>(null);

  const fetchEntries = useCallback(async () => {
    const res = await fetch("/api/admin/entries", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    setEntries(data.entries ?? []);
  }, []);

  const fetchEntriesOpen = useCallback(async () => {
    const res = await fetch("/api/admin/entries-status", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    setEntriesOpen(data?.open !== false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 최초 마운트 시 접수 목록을 불러옵니다.
    fetchEntries().finally(() => setEntriesLoading(false));
    fetchEntriesOpen();
  }, [fetchEntries, fetchEntriesOpen]);

  async function handleToggleEntriesOpen() {
    const next = !entriesOpen;
    setEntriesOpen(next);
    await fetch("/api/admin/entries-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ open: next }),
    });
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 다른 화면에서 #main으로 돌아오면 관리하기 화면을 보여줍니다.
    if (window.location.hash === "#main") setPhase("lobby");
  }, []);

  const drawGroup = entries.filter((e) => e.group_type === "draw");
  const remaining = drawGroup.filter((e) => !e.is_winner);
  const allWinners = drawGroup.filter((e) => e.is_winner);
  const isMultiDraw = roundWinners.length > 1;

  // 아직 정해진 인원을 다 못 뽑은 첫 번째 등수를 찾습니다. 없으면 -1(모두 완료).
  function findNextRoundIndex(): number {
    return PRIZE_ROUNDS.findIndex((round) => {
      const count = allWinners.filter((w) => w.prize_rank === round.rank).length;
      return count < round.count;
    });
  }

  function handleShowCover() {
    setPhase("cover");
  }

  function handleGoToLobby() {
    setPhase("lobby");
  }

  function handleSelectRound(rank: number) {
    const index = PRIZE_ROUNDS.findIndex((round) => round.rank === rank);
    if (index === -1) return;
    const round = PRIZE_ROUNDS[index];
    const drawnCount = allWinners.filter((w) => w.prize_rank === round.rank).length;
    if (drawnCount >= round.count) return;
    setRoundIndex(index);
    setPhase("prizeIntro");
  }

  function handleStartWithVideo() {
    const nextIndex = findNextRoundIndex();
    if (nextIndex === -1) {
      // 5등~1등 모두 이미 추첨이 끝난 경우, 곧바로 현황(관리하기) 화면으로 보냅니다.
      setPhase("lobby");
      return;
    }
    setRoundIndex(nextIndex);
    setPhase("prizeIntro");
  }

  async function handleStartDraw() {
    if (starting) return;
    const round = PRIZE_ROUNDS[roundIndex];
    if (!round) return;

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
        body: JSON.stringify({ count: round.count, rank: round.rank }),
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

  useEffect(() => {
    if (phase !== "reveal" || roundWinners.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 당첨 확정 후 최신 통계를 다시 불러옵니다.
    fetchEntries();
  }, [phase, roundWinners, fetchEntries]);

  function handleNextRound() {
    const nextIndex = roundIndex + 1;
    setRoundWinners([]);
    if (nextIndex >= PRIZE_ROUNDS.length) {
      setPhase("lobby");
      return;
    }
    setRoundIndex(nextIndex);
    setPhase("prizeIntro");
  }

  const currentRound = PRIZE_ROUNDS[roundIndex];
  const isLastRound = roundIndex >= PRIZE_ROUNDS.length - 1;

  function openEntryModal(winner: ReelEntry) {
    const full = entries.find((e) => e.id === winner.id);
    if (full) setSelectedEntry(full);
  }

  async function handleReset() {
    if (!window.confirm("정말 초기화하시겠습니까? 지금까지의 추첨 기록이 모두 사라집니다.")) return;
    await fetch("/api/admin/reset", { method: "POST" });
    await fetchEntries();
  }

  // PC/프로젝터에서 마우스 없이 스페이스바(또는 엔터, →)만 눌러도 화면별
  // "다음" 버튼을 누른 것과 동일하게 진행할 수 있게 해줍니다. 무선 프리젠터
  // 클리커도 보통 이 키들을 보내므로 클리커로도 조작할 수 있습니다.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code !== "Space" && e.key !== "Enter" && e.key !== "ArrowRight") return;
      e.preventDefault();

      if (phase === "cover") {
        handleStartWithVideo();
      } else if (phase === "prizeIntro") {
        if (!starting && !entriesLoading && remaining.length > 0) handleStartDraw();
      } else if (phase === "reveal") {
        handleNextRound();
      } else if (phase === "lobby") {
        if (findNextRoundIndex() !== -1) handleStartWithVideo();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <main className="relative flex flex-1 flex-col items-center overflow-hidden bg-[#f5f5f7] px-4 py-8 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-slate-300/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />

      {(phase === "cover" || phase === "lobby") && (
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 9A8 8 0 1 1 4 13" />
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
                onClick={handleGoToLobby}
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

        {phase === "lobby" && (
          <motion.div key="lobby" {...fadeUp} className="flex w-full flex-col items-center gap-4">
            <PrizeLobby
              winners={allWinners}
              onSelectWinner={openEntryModal}
              onStartDraw={handleStartWithVideo}
              onSelectRound={handleSelectRound}
              entriesOpen={entriesOpen}
              onToggleEntriesOpen={handleToggleEntriesOpen}
            />
            <button type="button" onClick={handleShowCover} className="text-xs text-slate-300 hover:text-slate-500">
              대문화면가기
            </button>
          </motion.div>
        )}

        {phase === "prizeIntro" && currentRound && (
          <motion.div key="prizeIntro" {...fadeUp} className="flex w-full flex-col items-center gap-4">
            {errorMessage && (
              <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{errorMessage}</p>
            )}
            {entriesLoading ? (
              <p className="text-sm text-slate-500">불러오는 중...</p>
            ) : remaining.length === 0 ? (
              <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
                추첨할 인원이 없습니다. 접수 현황을 확인해 주세요.
              </p>
            ) : (
              <PrizeIntro round={currentRound} onStart={handleStartDraw} starting={starting} />
            )}
            <button type="button" onClick={handleGoToLobby} className="text-xs text-slate-300 hover:text-slate-500">
              메인화면가기
            </button>
          </motion.div>
        )}

        {phase === "spin" && currentRound && roundWinners.length > 0 && (
          <motion.div key="spin" {...fadeUp} className="flex w-full flex-col items-center gap-4">
          <div
            className={`relative w-full overflow-hidden rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] ring-1 ring-white/60 ${
              isMultiDraw ? "max-w-6xl" : "max-w-3xl"
            }`}
            style={{ background: "linear-gradient(180deg, #eaf2fb 0%, #cfe0f2 45%, #9fb9d6 100%)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- next/image의 fill 방식이 프로덕션에서 간헐적으로 로드 실패해 일반 img로 우회합니다. 좁은 모바일 화면에서는 와이드 사진이 부자연스럽게 잘려 sm 이상에서만 보여줍니다. */}
            <img
              src="/images/event-visual-draw.webp"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 hidden h-full w-full object-cover sm:block"
            />
            <div className="absolute inset-0 hidden bg-white/55 backdrop-blur-md sm:block" />

            <div className="relative z-10 flex flex-col items-center gap-2 px-6 pt-8 text-center">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                AI 당첨자 추첨 <span className="text-blue-600">Agent</span>
              </h1>
              <p className="text-sm font-medium text-slate-500">
                {currentRound.label} {currentRound.prizeName} {currentRound.count}명
              </p>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-4 px-6 py-8 sm:px-10 sm:py-10">
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
          </div>
            <button type="button" onClick={handleGoToLobby} className="text-xs text-slate-300 hover:text-slate-500">
              메인화면가기
            </button>
          </motion.div>
        )}

        {phase === "reveal" && currentRound && roundWinners.length > 0 && (
          <motion.div key="reveal" {...fadeUp} className="flex w-full flex-col items-center gap-4">
            <PrizeReveal
              round={currentRound}
              winners={roundWinners}
              isLast={isLastRound}
              onNext={handleNextRound}
              onSelectWinner={openEntryModal}
            />
            <button type="button" onClick={handleGoToLobby} className="text-xs text-slate-300 hover:text-slate-500">
              메인화면가기
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedEntry && (() => {
        const resolved = resolveWinnerDisplay(selectedEntry.name, selectedEntry.department);
        return (
          <WrittenCardModal
            department={resolved.department}
            name={`${resolved.name}${resolved.titleSuffix}`}
            content={selectedEntry.content}
            groupLabel="지역단장"
            isWinner={selectedEntry.is_winner}
            onClose={() => setSelectedEntry(null)}
          />
        );
      })()}
    </main>
  );
}
