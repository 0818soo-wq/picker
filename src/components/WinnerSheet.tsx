import EventBanner from "@/components/EventBanner";

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
        titleHighlight={name}
        titleSuffix=" 님"
        subtitleLine1="소중한 의견을 나눠주셔서 감사합니다."
        subtitleLine2=""
      />

      <div className="flex flex-col gap-8 px-6 py-8 sm:px-10 sm:py-10">
        <div
          className="w-full whitespace-pre-wrap text-slate-900"
          style={{
            lineHeight: "2.5rem",
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0, transparent 2.4rem, #d9dee6 2.4rem, #d9dee6 calc(2.4rem + 1px))",
          }}
        >
          {content}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <StaticField label="지역단/파트" value={department} />
          <StaticField label="지역단장/파트장" value={name} />
        </div>
      </div>
    </div>
  );
}

function StaticField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      {label}
      <div className="border-b-2 border-slate-300 px-1 py-2 text-base text-slate-900">{value}</div>
    </div>
  );
}
