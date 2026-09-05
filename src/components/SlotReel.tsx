"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

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

const BADGE_TEXT = "'26.하 CSM전략회의 이벤트 Agent";

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

const COMPACT_ITEM_WIDTH = 118;
const COMPACT_ITEM_HEIGHT = 150;
const COMPACT_ITEM_GAP = 10;
const COMPACT_SLOT_STEP = COMPACT_ITEM_WIDTH + COMPACT_ITEM_GAP;
const COMPACT_LEAD_COUNT = 14;
const COMPACT_TRAIL_COUNT = 4;
const COMPACT_BASE_DURATION = 3.6;
// 여러 명을 동시에 뽑을 때, 릴이 한꺼번에 딱 멈추지 않고 순서대로 "파바바박" 걸리는 느낌을 주기 위한 간격입니다.
const COMPACT_SETTLE_STAGGER = 0.22;

// 한 번에 여러 명을 추첨할 때, 당첨자 수(N)에 맞춰 상단/하단 행을 균형 있게 나눕니다.
// 8명: 4+4, 7명: 4+3, 6명: 3+3 ... 항상 상단이 하단보다 많거나 같습니다.
export function splitBalancedRows<T>(items: T[]): { top: T[]; bottom: T[] } {
  const topCount = Math.ceil(items.length / 2);
  return { top: items.slice(0, topCount), bottom: items.slice(topCount) };
}

export function MultiSlotReel({
  pool,
  winners,
  onAllSettled,
}: {
  pool: ReelEntry[];
  winners: ReelEntry[];
  onAllSettled: () => void;
}) {
  const { top, bottom } = splitBalancedRows(winners);
  const settledCount = useRef(0);

  function handleRowSettle() {
    settledCount.current += 1;
    if (settledCount.current >= winners.length) onAllSettled();
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="grid w-full gap-3" style={{ gridTemplateColumns: `repeat(${top.length}, minmax(0, 1fr))` }}>
        {top.map((winner, i) => (
          <CompactReelRow
            key={winner.id}
            pool={pool}
            winner={winner}
            duration={COMPACT_BASE_DURATION + i * COMPACT_SETTLE_STAGGER}
            onSettle={handleRowSettle}
          />
        ))}
      </div>
      {bottom.length > 0 && (
        <div
          className="grid w-full gap-3"
          style={{ gridTemplateColumns: `repeat(${bottom.length}, minmax(0, 1fr))` }}
        >
          {bottom.map((winner, i) => (
            <CompactReelRow
              key={winner.id}
              pool={pool}
              winner={winner}
              duration={COMPACT_BASE_DURATION + (top.length + i) * COMPACT_SETTLE_STAGGER}
              onSettle={handleRowSettle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CompactReelRow({
  pool,
  winner,
  duration,
  onSettle,
}: {
  pool: ReelEntry[];
  winner: ReelEntry;
  duration: number;
  onSettle: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [targetX, setTargetX] = useState<number | null>(null);

  const reelItems = useMemo<ReelEntry[]>(() => {
    const sourcePool = pool.filter((item) => item.id !== winner.id);
    const base = sourcePool.length > 0 ? sourcePool : [winner];
    const totalFillerNeeded = COMPACT_LEAD_COUNT + COMPACT_TRAIL_COUNT;

    const filler =
      base.length >= totalFillerNeeded
        ? shuffle(base).slice(0, totalFillerNeeded)
        : buildFillerSequence(base, totalFillerNeeded);

    return [...filler.slice(0, COMPACT_LEAD_COUNT), winner, ...filler.slice(COMPACT_LEAD_COUNT, totalFillerNeeded)];
  }, [pool, winner]);

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
      setTargetX(-(COMPACT_LEAD_COUNT * COMPACT_SLOT_STEP));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 py-3"
      style={{ minWidth: COMPACT_ITEM_WIDTH + COMPACT_ITEM_GAP }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 z-10 -translate-x-1/2 rounded-xl border-[3px] border-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.35)]"
        style={{ width: COMPACT_ITEM_WIDTH }}
      />
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-slate-50 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-slate-50 to-transparent" />

      <motion.div
        className="flex items-stretch"
        style={{
          gap: COMPACT_ITEM_GAP,
          paddingLeft: containerWidth ? containerWidth / 2 - COMPACT_ITEM_WIDTH / 2 : 0,
        }}
        animate={{ x: targetX ?? 0 }}
        transition={targetX === null ? { duration: 0 } : { duration, ease: [0.11, 0.83, 0.24, 1] }}
        onAnimationComplete={() => {
          if (targetX !== null) onSettle();
        }}
      >
        {reelItems.map((item, index) => (
          <CompactPaperCard key={`${item.id}-${index}`} item={item} />
        ))}
      </motion.div>
    </div>
  );
}

function CompactPaperCard({ item }: { item: ReelEntry }) {
  return (
    <div
      className="flex shrink-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
      style={{ width: COMPACT_ITEM_WIDTH, height: COMPACT_ITEM_HEIGHT }}
    >
      <div className="relative isolate flex flex-1 items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- 작은 릴 카드 배경용 실사 사진 */}
        <img
          src="/images/event-visual-compass.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-left"
        />
      </div>
      <div className="flex shrink-0 flex-col items-center gap-0.5 px-2 py-2 text-center">
        <p className="truncate text-[8px] text-slate-400">{item.department}</p>
        <p className="truncate text-[10px] font-bold text-slate-800">{item.name}</p>
      </div>
    </div>
  );
}

function MiniPaperCard({ item }: { item: ReelEntry }) {
  return (
    <div
      className="flex shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      style={{ width: ITEM_WIDTH, height: ITEM_HEIGHT }}
    >
      <div className="relative isolate shrink-0 overflow-hidden px-3 py-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- 작은 릴 카드 배경용 실사 사진 */}
        <img
          src="/images/event-visual-compass.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-[left_bottom]"
        />

        <div className="relative z-10 ml-9 flex flex-col gap-1">
          <span className="inline-flex w-fit items-center rounded-full bg-[#13294b] px-2 py-0.5 text-[7px] font-bold text-white">
            {BADGE_TEXT}
          </span>
          <p className="text-[8px] font-extrabold leading-tight text-slate-900">
            우리 조직의 새로운 축,
            <br />
            어떠한 <span className="text-blue-600">‘축의 전환’</span>이
            <br />
            필요할까요?
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
