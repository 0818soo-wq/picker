import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 bg-[#f5f5f7] px-6 py-24 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="text-sm font-medium text-slate-500">&lsquo;26.하 CSM전략회의 이벤트</span>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          AI 당첨자 추첨 Agent
        </h1>
        <p className="max-w-md text-slate-500">
          우리 조직에 필요한 변화에 대한 의견을 접수하고, 추첨을 통해 선물을 받아가세요.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/entry/leader"
          className="flex h-14 w-full items-center justify-center rounded-full bg-slate-900 px-8 text-base font-semibold text-white shadow-sm transition-colors hover:bg-slate-700"
        >
          지역단장 접수 (추첨 대상)
        </Link>
        <Link
          href="/entry/staff"
          className="flex h-14 w-full items-center justify-center rounded-full bg-white px-8 text-base font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
        >
          본사 파트장 접수 (추첨 제외)
        </Link>
        <Link
          href="/draw"
          className="flex h-14 w-full items-center justify-center rounded-full bg-white px-8 text-base font-semibold text-blue-600 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
        >
          AI 당첨자 추첨 Agent (진행자용)
        </Link>
      </div>
    </main>
  );
}
