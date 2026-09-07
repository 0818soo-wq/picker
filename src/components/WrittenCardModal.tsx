"use client";

// 당첨자현황/작성자현황에서 이름을 눌렀을 때, 실제 접수 목록(작성카드보기)과
// 같은 느낌의 카드로 작성 내용을 보여주는 공용 팝업입니다.
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: "linear-gradient(180deg, #eaf2fb 0%, #cfe0f2 100%)" }}
        >
          <span className="truncate text-xs font-medium text-slate-600">{department}</span>
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-bold text-slate-900">{name}</span>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full px-2 py-0.5 text-xs text-slate-500 hover:bg-white/50 hover:text-slate-700"
            >
              닫기
            </button>
          </div>
        </div>

        <p className="max-h-[50vh] min-h-24 overflow-y-auto whitespace-pre-wrap px-4 py-4 text-sm leading-relaxed text-slate-700">
          {content}
        </p>

        {(groupLabel || isWinner) && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2">
            <span className="text-[11px] text-slate-400">{groupLabel}</span>
            {isWinner && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
                당첨
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
