import Link from "next/link";

// 접수목록/작성자현황/당첨자현황 등 관리자용 하위 화면들 사이를 오갈 수 있는 공통 하단 내비게이션입니다.
export default function AdminSubNav() {
  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-400">
      <Link href="/draw#main" className="hover:text-slate-600">
        메인화면가기
      </Link>
      <span>·</span>
      <Link href="/draw/status" className="hover:text-slate-600">
        작성자현황
      </Link>
      <span>·</span>
      <Link href="/draw/entries" className="hover:text-slate-600">
        작성카드보기
      </Link>
      <span>·</span>
      <Link href="/draw/monitor" className="hover:text-slate-600">
        당첨자현황
      </Link>
    </div>
  );
}
