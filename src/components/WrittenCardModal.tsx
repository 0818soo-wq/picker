"use client";

import EventBanner from "@/components/EventBanner";

// 당첨자현황/작성자현황/관리하기 등에서 이름을 눌렀을 때, 실제 접수 용지와
// 똑같은 느낌(배너 + 줄노트)으로 작성 내용을 보여주는 공용 팝업입니다.
export default function WrittenCardModal({
  department,
  name,
  content,
  groupLabel,
  isWinner,
  onClose,
}: {
  department: string;
  name: string;
  content: string;
  groupLabel?: string;
  isWinner?: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-slate-500 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-slate-700"
        >
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {isWinner && (
          <span className="absolute left-6 top-6 z-20 inline-flex items-center rounded-full bg-[#13294b] px-3 py-1 text-xs font-bold text-white shadow-sm">
            당첨
          </span>
        )}

        <EventBanner />

        <div className="max-h-[45vh] overflow-y-auto px-6 py-6 sm:px-10 sm:py-8">
          <p
            className="font-kimjungchul whitespace-pre-wrap text-xl leading-[2.75rem] text-slate-900 sm:text-2xl"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, transparent 0, transparent 2.7rem, #e2e6ee 2.7rem, #e2e6ee calc(2.7rem + 1px))",
            }}
          >
            {content}
          </p>
        </div>

        <div className="flex gap-6 border-t border-slate-100 px-6 py-5 sm:px-10 sm:py-6">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400">{groupLabel === "파트장" ? "본사/파트" : "지역단/파트"}</p>
            <p className="truncate border-b-2 border-slate-300 pb-1.5 text-lg font-bold text-slate-900 sm:text-xl">
              {department}
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400">{groupLabel === "파트장" ? "파트장" : "지역단장/파트장"}</p>
            <p className="truncate border-b-2 border-slate-300 pb-1.5 text-lg font-bold text-slate-900 sm:text-xl">
              {name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
