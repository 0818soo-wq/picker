"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CompassIcon, LightBeam, MountainBackdrop } from "@/components/EventBanner";

export type ReelEntry = {
  id: string;
  department: string;
  name: string;
  content: string;
};

const ITEM_WIDTH = 210;
const ITEM_HEIGHT = 300;
const ITEM_GAP = 16;
const SLOT_STEP = ITEM_WIDTH + ITEM_GAP;
// 당첨 카드가 배열의 맨 끝이 아니라 릴 중간쯤에서 멈추도록, 앞/뒤에 카드가 남도록 구성합니다.
const LEAD_COUNT = 24;
const TRAIL_COUNT = 6;

const BADGE_TEXT = "CSM전략회의 소통의 장 1";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// base 배열만으로 length개를 채우되, 배치 경계에서 같은 카드가 연속으로 나오지 않도록 합니다.
function buildFillerSequence(base: ReelEntry[], length: number): ReelEntry[] {
  if (base.length === 0) return [];
  const result: ReelEntry[] = [];
  while (result.length < length) {
    const batch = shuffle(base);
    if (batch.length > 1 && result.length > 0 && batch[0].id === result[result.length - 1].id) {
      [batch[0], batch[1]] = [batch[1], batch[0]];
    }
    result.push(...batch);
  }
  return result.slice(0, length);
}

export default function SlotReel({
  pool,
  winner,
  onSettle,
}: {
  pool: ReelEntry[];
  winner: ReelEntry;
  onSettle: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [targetX, setTargetX] = useState<number | null>(null);

  const reelItems = useMemo<ReelEntry[]>(() => {
    const sourcePool = pool.filter((item) => item.id !== winner.id);
    const base = sourcePool.length > 0 ? sourcePool : [winner];
    const totalFillerNeeded = LEAD_COUNT + TRAIL_COUNT;

    // 후보가 충분하면 중복 없이 무작위로 뽑고, 부족할 때만 최소한으로 반복합니다.
    const filler =
      base.length >= totalFillerNeeded
        ? shuffle(base).slice(0, totalFillerNeeded)
        : buildFillerSequence(base, totalFillerNeeded);

    return [...filler.slice(0, LEAD_COUNT), winner, ...filler.slice(LEAD_COUNT, totalFillerNeeded)];
  }, [pool, winner]);

  const winnerIndex = LEAD_COUNT;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.offsetWidth);

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setTargetX(-(winnerIndex * SLOT_STEP));
    });
    return () => cancelAnimationFrame(id);
  }, [winnerIndex]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 py-6"
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 z-10 -translate-x-1/2 rounded-2xl border-4 border-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.35)]"
        style={{ width: ITEM_WIDTH }}
      />
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-slate-50 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-slate-50 to-transparent" />

      <motion.div
        className="flex items-stretch"
        style={{
          gap: ITEM_GAP,
          paddingLeft: containerWidth ? containerWidth / 2 - ITEM_WIDTH / 2 : 0,
        }}
        animate={{ x: targetX ?? 0 }}
        transition={targetX === null ? { duration: 0 } : { duration: 5.2, ease: [0.11, 0.83, 0.24, 1] }}
        onAnimationComplete={() => {
          if (targetX !== null) onSettle();
        }}
      >
        {reelItems.map((item, index) => (
          <MiniPaperCard key={`${item.id}-${index}`} item={item} />
        ))}
      </motion.div>
    </div>
  );
}

function MiniPaperCard({ item }: { item: ReelEntry }) {
  return (
    <div
      className="flex shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      style={{ width: ITEM_WIDTH, height: ITEM_HEIGHT }}
    >
      <div
        className="relative isolate shrink-0 overflow-hidden px-3 py-3"
        style={{ background: "linear-gradient(180deg, #eaf2fb 0%, #cfe0f2 45%, #9fb9d6 100%)" }}
      >
        <MountainBackdrop />
        <LightBeam className="absolute right-4 top-0 h-full w-1 opacity-80" />
        <CompassIcon className="absolute left-1 top-1/2 h-9 w-9 -translate-y-1/2 text-slate-700/60" />

        <div className="relative z-10 ml-9 flex flex-col gap-1">
          <span className="inline-flex w-fit items-center rounded-full bg-[#13294b] px-2 py-0.5 text-[7px] font-bold text-white">
            {BADGE_TEXT}
          </span>
          <p className="text-[10px] font-extrabold leading-tight text-slate-900">
            우리 조직의 새로운 축,
            <br />
            어떠한 <span className="text-blue-600">‘축의 전환’</span>이
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between overflow-hidden px-3 py-2">
        <p
          className="line-clamp-4 flex-1 overflow-hidden text-left text-[10px] leading-5 text-slate-600"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0, transparent 1.25rem, #e5e9ef 1.25rem, #e5e9ef calc(1.25rem + 1px))",
          }}
        >
          {item.content}
        </p>

        <div className="mt-2 flex shrink-0 gap-2 border-t border-slate-200 pt-1.5">
          <div className="min-w-0 flex-1">
            <p className="text-[7px] text-slate-400">지역단</p>
            <p className="truncate border-b border-slate-300 pb-0.5 text-[10px] font-semibold text-slate-800">
              {item.department}
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[7px] text-slate-400">지역단장</p>
            <p className="truncate border-b border-slate-300 pb-0.5 text-[10px] font-semibold text-slate-800">
              {item.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
