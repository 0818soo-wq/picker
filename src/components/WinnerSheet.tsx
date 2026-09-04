import EventBanner from "@/components/EventBanner";
import { stripLeaderTitle } from "@/lib/format";

export default function WinnerSheet({
  department,
  name,
  content,
}: {
  department: string;
  name: string;
  content: string;
}) {
  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl">
      <EventBanner
        badge="당첨자 발표"
        titleLine1="🎉 당첨을 축하합니다!"
        titlePrefix={`${department} `}
        titleHighlight={stripLeaderTitle(name)}
        titleSuffix=" 단장님"
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
