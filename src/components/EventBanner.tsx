const EVENT_BADGE = "CSM전략회의 소통의 장 1";
const EVENT_TITLE_LINE1 = "우리 조직의 새로운 축,";
const EVENT_TITLE_PREFIX = "어떠한 ";
const EVENT_TITLE_HIGHLIGHT = "‘축의 전환’";
const EVENT_TITLE_SUFFIX = "이 필요할까요?";
const EVENT_SUBTITLE_LINE1 = "변화하는 환경 속에서 우리 조직이 나아가야 할 방향을";
const EVENT_SUBTITLE_LINE2 = "함께 고민해주세요.";

export default function EventBanner() {
  return (
    <div
      className="relative isolate overflow-hidden px-6 py-10 sm:px-10 sm:py-12"
      style={{ background: "linear-gradient(180deg, #eaf2fb 0%, #cfe0f2 45%, #9fb9d6 100%)" }}
    >
      <MountainBackdrop />
      <LightBeam className="absolute right-10 top-0 h-full w-1.5 sm:right-16" />
      <CompassIcon className="absolute left-2 top-1/2 hidden h-24 w-24 -translate-y-1/2 text-slate-700/60 sm:left-4 sm:block sm:h-28 sm:w-28" />

      <div className="relative z-10 flex flex-col gap-3 sm:ml-28">
        <span className="inline-flex w-fit items-center rounded-full bg-[#13294b] px-4 py-1.5 text-xs font-bold text-white sm:text-sm">
          {EVENT_BADGE}
        </span>
        <h1 className="text-2xl font-extrabold leading-snug text-slate-900 sm:text-3xl">
          {EVENT_TITLE_LINE1}
          <br />
          {EVENT_TITLE_PREFIX}
          <span className="text-blue-600">{EVENT_TITLE_HIGHLIGHT}</span>
          {EVENT_TITLE_SUFFIX}
        </h1>
        <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
          {EVENT_SUBTITLE_LINE1}
          <br />
          {EVENT_SUBTITLE_LINE2}
        </p>
      </div>
    </div>
  );
}

function CompassIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="0.75" opacity="0.6" />
      <g fill="currentColor">
        <polygon points="50,6 58,50 50,42 42,50" />
        <polygon points="50,94 58,50 50,58 42,50" opacity="0.5" />
        <polygon points="6,50 50,42 42,50 50,58" opacity="0.5" />
        <polygon points="94,50 50,42 58,50 50,58" opacity="0.5" />
      </g>
      <text x="50" y="17" textAnchor="middle" fontSize="9" fill="currentColor" fontWeight="bold">
        N
      </text>
      <text x="50" y="93" textAnchor="middle" fontSize="9" fill="currentColor">
        S
      </text>
      <text x="11" y="53" textAnchor="middle" fontSize="9" fill="currentColor">
        W
      </text>
      <text x="89" y="53" textAnchor="middle" fontSize="9" fill="currentColor">
        E
      </text>
    </svg>
  );
}

function MountainBackdrop() {
  return (
    <svg
      className="absolute inset-x-0 bottom-0 h-2/3 w-full text-[#7a95b8]"
      viewBox="0 0 400 150"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      <polygon
        points="0,150 60,70 120,120 180,50 260,110 320,60 400,100 400,150"
        fill="currentColor"
        opacity="0.35"
      />
      <polygon points="0,150 90,100 170,140 240,90 320,130 400,150" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

function LightBeam({ className }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0))",
        filter: "blur(6px)",
        transform: "rotate(8deg)",
      }}
    />
  );
}
