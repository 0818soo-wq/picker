"use client";

import EventBanner from "@/components/EventBanner";
import { splitBalancedRows, type ReelEntry } from "@/components/SlotReel";
import { resolveWinnerDisplay } from "@/lib/format";
import SpeakerButton from "@/components/SpeakerButton";

export default function WinnerSheet({
  department,
  name,
  content,
}: {
  department: string;
  name: string;
  content: string;
}) {
  const resolved = resolveWinnerDisplay(name, department);
  const announceText = `${resolved.department} ${resolved.name}${resolved.titleSuffix} 축하합니다!`;

  return (
    <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl">
      <EventBanner
        badge="당첨자 발표"
        titleIcon={
          <SpeakerButton text={announceText} className="cursor-pointer transition-transform hover:scale-110 active:scale-95">
            🎉
          </SpeakerButton>
        }
        titleLine1="당첨을 축하합니다!"
        titlePrefix=""
        titleHighlight={`${resolved.department} ${resolved.name}`}
        titleSuffix={` ${resolved.titleSuffix}`}
        subtitleLine1="소중한 의견을 나눠주셔서 감사합니다."
        subtitleLine2=""
      />

      <div className="flex flex-col gap-8 px-6 py-8 sm:px-10 sm:py-10">
        <div
          className="w-full overflow-y-auto whitespace-pre-wrap text-slate-900"
          style={{
            lineHeight: "2.5rem",
            height: "20rem",
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0, transparent 2.4rem, #d9dee6 2.4rem, #d9dee6 calc(2.4rem + 1px))",
          }}
        >
          {content}
        </div>
      </div>
    </div>
  );
}

// 여러 명을 한 번에 추첨했을 때, 내용 없이 이름 카드만 균형 있게(상단/하단) 보여주는 발표 화면입니다.
// PC 화면 비율을 고려해 각 행의 카드 수만큼 그리드 열을 고정해 줄바꿈 없이 정확히 배치합니다.
export function WinnerNameGrid({ winners }: { winners: ReelEntry[] }) {
  const { top, bottom } = splitBalancedRows(winners);
  // 여러 명을 한 번에 뽑았을 때는 소속 없이 "이름+직책"을 먼저 쭉 부른 뒤
  // 마지막에 "축하합니다!"로 마무리합니다.
  const announceText = `${winners
    .map((w) => {
      const resolved = resolveWinnerDisplay(w.name, w.department);
      return `${resolved.name}${resolved.titleSuffix}`;
    })
    .join(" ")} 축하합니다!`;

  return (
    <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl">
      <EventBanner
        badge="당첨자 발표"
        titleIcon={
          <SpeakerButton text={announceText} className="cursor-pointer transition-transform hover:scale-110 active:scale-95">
            🎉
          </SpeakerButton>
        }
        titleLine1={`${winners.length}명의 당첨을 축하합니다!`}
        titlePrefix=""
        titleHighlight=""
        titleSuffix=""
        subtitleLine1="소중한 의견을 나눠주셔서 감사합니다."
        subtitleLine2=""
      />

      <div className="flex flex-col items-center gap-4 px-6 py-8 sm:px-10 sm:py-10">
        <div
          className="grid w-full gap-4"
          style={{ gridTemplateColumns: `repeat(${top.length}, minmax(0, 1fr))` }}
        >
          {top.map((w) => (
            <WinnerNameCard key={w.id} department={w.department} name={w.name} />
          ))}
        </div>
        {bottom.length > 0 && (
          <div
            className="grid w-full gap-4"
            style={{ gridTemplateColumns: `repeat(${bottom.length}, minmax(0, 1fr))` }}
          >
            {bottom.map((w) => (
              <WinnerNameCard key={w.id} department={w.department} name={w.name} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WinnerNameCard({ department, name }: { department: string; name: string }) {
  const resolved = resolveWinnerDisplay(name, department);

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
      <div className="relative isolate flex flex-col items-center gap-1 overflow-hidden px-2 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- 작은 카드 배경용 실사 사진 */}
        <img
          src="/images/event-visual-plain.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <span className="relative z-10 inline-flex items-center rounded-full bg-[#13294b] px-2 py-0.5 text-[10px] font-bold text-white">
          당첨
        </span>
      </div>
      <div className="flex flex-col items-center gap-0.5 px-3 py-3 text-center">
        <p className="truncate text-xs font-medium text-slate-500">{resolved.department}</p>
        <p className="text-sm font-extrabold text-slate-900">
          {resolved.name}
          {resolved.titleSuffix}
        </p>
      </div>
    </div>
  );
}
