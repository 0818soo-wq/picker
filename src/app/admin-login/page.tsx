"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [passcode, setPasscode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error ?? "로그인에 실패했습니다.");
        setSubmitting(false);
        return;
      }

      const next = searchParams.get("next") || "/draw";
      router.push(next);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-[#f5f5f7] px-6 py-24">
      <h1 className="text-2xl font-semibold text-slate-900">관리자 인증</h1>
      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-4">
        <input
          type="password"
          autoFocus
          required
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="비밀번호"
          className="rounded-2xl border-0 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900"
        />
        {error && <p className="rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="flex h-12 items-center justify-center rounded-full bg-slate-900 px-8 text-base font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "확인 중..." : "입장하기"}
        </button>
      </form>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}
