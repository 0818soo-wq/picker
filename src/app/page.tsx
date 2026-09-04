import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 bg-zinc-50 px-6 py-24 text-center dark:bg-black">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          조직 전환 추첨 이벤트
        </h1>
        <p className="max-w-md text-zinc-600 dark:text-zinc-400">
          우리 조직에 필요한 변화에 대한 의견을 접수하고, 추첨을 통해 선물을 받아가세요.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/entry/leader"
          className="flex h-14 w-full items-center justify-center rounded-full bg-zinc-900 px-8 text-base font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          지역단장 접수 (추첨 대상)
        </Link>
        <Link
          href="/entry/staff"
          className="flex h-14 w-full items-center justify-center rounded-full border border-zinc-300 px-8 text-base font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          본사 파트장 접수 (추첨 제외)
        </Link>
      </div>
    </main>
  );
}
