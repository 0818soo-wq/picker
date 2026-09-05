import type { ReactNode } from "react";

const EVENT_BADGE = "'26.하 CSM전략회의 이벤트 Agent";
const EVENT_TITLE_LINE1 = "우리 조직의 새로운 축,";
const EVENT_TITLE_PREFIX = "어떠한 ";
const EVENT_TITLE_HIGHLIGHT = "‘축의 전환’";
const EVENT_TITLE_SUFFIX = "이 필요할까요?";
const EVENT_SUBTITLE_LINE1 = "변화하는 환경 속에서 우리 조직이 나아가야 할 방향을";
const EVENT_SUBTITLE_LINE2 = "함께 고민해주세요.";

export default function EventBanner({
  badge = EVENT_BADGE,
  titleIcon,
  titleLine1 = EVENT_TITLE_LINE1,
  titlePrefix = EVENT_TITLE_PREFIX,
  titleHighlight = EVENT_TITLE_HIGHLIGHT,
  titleSuffix = EVENT_TITLE_SUFFIX,
  subtitleLine1 = EVENT_SUBTITLE_LINE1,
  subtitleLine2 = EVENT_SUBTITLE_LINE2,
}: {
  badge?: string;
  titleIcon?: ReactNode;
  titleLine1?: string;
  titlePrefix?: string;
  titleHighlight?: string;
  titleSuffix?: string;
  subtitleLine1?: string;
  subtitleLine2?: string;
}) {
  // 커스텀 문구 없이 기본 문구 그대로 쓰는 경우(대기/추첨 화면, 접수 화면)는
  // 나침반이 있는 원본 배경을, 당첨자 발표처럼 문구가 매번 바뀌는 화면은
  // 나침반과 문구가 겹치지 않도록 나침반 없는 배경을 사용합니다.
  const isDefault = badge === EVENT_BADGE && titleLine1 === EVENT_TITLE_LINE1;

  return (
    <div
      className="relative isolate overflow-hidden px-6 py-10 sm:px-10 sm:py-12"
      style={{ background: "linear-gradient(180deg, #eaf2fb 0%, #cfe0f2 45%, #9fb9d6 100%)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- next/image의 fill 방식이
          프로덕션에서 간헐적으로 로드 실패해 일반 img로 우회합니다. */}
      <img
        src={isDefault ? "/images/event-banner-v2-compass.jpg" : "/images/event-banner-v2-plain.jpg"}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        onError={(e) => {
          console.error("[EventBanner] 배경 이미지 로드 실패:", e.currentTarget.src);
          e.currentTarget.style.display = "none";
        }}
      />

      <div className={`relative z-10 flex flex-col gap-3 ${isDefault ? "ml-16 sm:ml-28" : ""}`}>
        <span className="inline-flex w-fit items-center rounded-full bg-[#13294b] px-4 py-1.5 text-xs font-bold text-white sm:text-sm">
          {badge}
        </span>
        <h1 className="text-2xl font-extrabold leading-snug text-slate-900 sm:text-3xl">
          {titleIcon && <>{titleIcon} </>}
          {titleLine1}
          {(titlePrefix || titleHighlight || titleSuffix) && (
            <>
              <br />
              {titlePrefix}
              <span className="text-blue-600">{titleHighlight}</span>
              {titleSuffix}
            </>
          )}
        </h1>
        {(subtitleLine1 || subtitleLine2) && (
          <p
            className="text-sm leading-relaxed text-slate-700 sm:text-base"
            style={{ textShadow: "0 1px 4px rgba(255,255,255,0.6)" }}
          >
            {subtitleLine1}
            {subtitleLine1 && subtitleLine2 && <br />}
            {subtitleLine2}
          </p>
        )}
      </div>
    </div>
  );
}

export function CompassIcon({ className }: { className?: string }) {
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

export function SailboatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="50" y1="10" x2="50" y2="66" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M50 16 L50 58 L23 58 Z"
        fill="currentColor"
        opacity="0.18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M50 24 L50 58 L73 58 Z"
        fill="currentColor"
        opacity="0.35"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M18 66 L82 66 L69 84 L31 84 Z" fill="currentColor" />
      <path
        d="M6 90 Q28 82 50 90 T94 90"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}

export function MountainBackdrop({ className }: { className?: string } = {}) {
  return (
    <svg
      className={className ?? "absolute inset-x-0 bottom-0 h-2/3 w-full text-[#7a95b8]"}
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

export function LightBeam({ className }: { className?: string }) {
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
