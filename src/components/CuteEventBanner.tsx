const BADGE_TEXT = "'26.하 CSM전략회의 이벤트 Agent";

// 당근마켓 같은 귀엽고 아기자기한 톤(블루 버전)의 배너입니다.
// 실제 접수 용지(EventBanner)와는 별개로, /cute 경로의 디자인 비교용으로만 씁니다.
export default function CuteEventBanner({
  title = "우리 조직의 새로운 축,",
  highlight = "축의 전환",
  subtitle = "귀여운 마음을 담아 의견을 들려주세요 💙",
}: {
  title?: string;
  highlight?: string;
  subtitle?: string;
}) {
  return (
    <div
      className="relative isolate overflow-hidden px-6 py-10 sm:px-10 sm:py-14"
      style={{ background: "linear-gradient(160deg, #eaf3ff 0%, #dcebff 60%, #cfe3ff 100%)" }}
    >
      <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/50 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-6 h-52 w-52 rounded-full bg-blue-200/50 blur-2xl" />
      <div className="pointer-events-none absolute right-14 top-6 h-6 w-6 rounded-full bg-blue-300/60" />
      <div className="pointer-events-none absolute right-28 top-16 h-3 w-3 rounded-full bg-blue-400/60" />

      <div className="relative z-10 flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-blue-500 shadow-sm">
          🥕 {BADGE_TEXT}
        </span>
        <h1 className="font-cute text-2xl leading-snug text-blue-950 sm:text-3xl">
          {title}
          <br />
          어떠한 <span className="text-blue-500">&lsquo;{highlight}&rsquo;</span>이 필요할까요?
        </h1>
        <p className="text-sm leading-relaxed text-blue-900/60 sm:text-base">{subtitle}</p>
      </div>
    </div>
  );
}
