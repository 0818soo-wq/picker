import EventBanner, { CompassIcon, LightBeam, MountainBackdrop } from "@/components/EventBanner";
import { splitBalancedRows, type ReelEntry } from "@/components/SlotReel";
import { resolveWinnerDisplay } from "@/lib/format";

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

  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl">
      <EventBanner
        badge="당첨자 발표"
        titleLine1="🎉 당첨을 축하합니다!"
        titlePrefix={`${resolved.department} `}
        titleHighlight={resolved.name}
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
export function WinnerNameGrid({ winners }: { winners: ReelEntry[] }) {
  const { top, bottom } = splitBalancedRows(winners);

  return (
    <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-xl">
      <EventBanner
        badge="당첨자 발표"
        titleLine1={`🎉 ${winners.length}명의 당첨을 축하합니다!`}
        titlePrefix=""
        titleHighlight=""
        titleSuffix=""
        subtitleLine1="소중한 의견을 나눠주셔서 감사합니다."
        subtitleLine2=""
      />

      <div className="flex flex-col items-center gap-4 px-6 py-8 sm:px-10 sm:py-10">
        <div className="flex flex-wrap justify-center gap-4">
          {top.map((w) => (
            <WinnerNameCard key={w.id} department={w.department} name={w.name} />
          ))}
        </div>
        {bottom.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4">
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
    <div className="flex w-36 shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md sm:w-40">
      <div
        className="relative isolate flex flex-col items-center gap-1 overflow-hidden px-2 py-4"
        style={{ background: "linear-gradient(180deg, #eaf2fb 0%, #cfe0f2 45%, #9fb9d6 100%)" }}
      >
        <MountainBackdrop />
        <LightBeam className="absolute right-3 top-0 h-full w-1 opacity-80" />
        <span className="relative z-10 inline-flex items-center rounded-full bg-[#13294b] px-2 py-0.5 text-[10px] font-bold text-white">
          당첨
        </span>
        <CompassIcon className="relative z-10 h-8 w-8 text-slate-700/60" />
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
