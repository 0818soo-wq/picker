"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

export type ReelEntry = {
  id: string;
  department: string;
  name: string;
  content: string;
};

const ITEM_WIDTH = 220;
const ITEM_HEIGHT = 220;
const ITEM_GAP = 16;
const SLOT_STEP = ITEM_WIDTH + ITEM_GAP;
const SPIN_ITEM_COUNT = 28;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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
    const filler: ReelEntry[] = [];
    while (filler.length < SPIN_ITEM_COUNT) {
      filler.push(...shuffle(base));
    }
    return [...filler.slice(0, SPIN_ITEM_COUNT), winner];
  }, [pool, winner]);

  const winnerIndex = reelItems.length - 1;

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
          <div
            key={`${item.id}-${index}`}
            className="flex shrink-0 flex-col justify-center gap-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm"
            style={{ width: ITEM_WIDTH, height: ITEM_HEIGHT }}
          >
            <p className="truncate text-xs text-slate-500">{item.department}</p>
            <p className="truncate text-lg font-bold text-slate-900">{item.name}</p>
            <p className="mt-1 line-clamp-4 text-xs leading-relaxed text-slate-600">{item.content}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
