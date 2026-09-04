import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 bg-zinc-50 px-6 py-24 text-center dark:bg-black">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          조직 전환 추첨 이벤트
        </h1>
        <p className="max-w-md text-zinc-600 dark:text-zinc-400">
          우리 조직에 필요한 변화를 담은 사진을 접수하고, 추첨을 통해 선물을 받아가세요.
        </p>
      </div>

      <Link
        href="/entry"
        className="flex h-14 w-full max-w-xs items-center justify-center rounded-full bg-zinc-900 px-8 text-base font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        사진 접수하러 가기
      </Link>
    </main>
  );
}
