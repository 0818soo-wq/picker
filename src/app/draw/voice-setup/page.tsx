"use client";

import { useState } from "react";
import Link from "next/link";

export default function VoiceSetupPage() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("사장님");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file || submitting) return;

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("name", name);

      const res = await fetch("/api/admin/typecast-clone", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(JSON.stringify(data, null, 2));
        return;
      }

      setResult(data.result);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  const voiceId =
    result && typeof result === "object" && result !== null && "voice_id" in result
      ? String((result as { voice_id: unknown }).voice_id)
      : null;

  return (
    <main className="flex flex-1 flex-col items-center bg-[#f5f5f7] px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-xl">
        <Link href="/draw" className="text-sm text-slate-500 hover:text-slate-700">
          ← 추첨 화면으로
        </Link>
        <h1 className="mt-1 mb-1 text-2xl font-bold text-slate-900">타입캐스트 음성 클로닝</h1>
        <p className="mb-8 text-sm text-slate-500">
          음성 샘플(mp3/wav, 25MB 이하)을 올리면 API에서 바로 사용 가능한 커스텀 보이스를 생성합니다.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            보이스 이름
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              required
              className="rounded-xl border-0 px-3 py-2 text-base text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            음성 샘플 파일 (mp3/wav)
            <input
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="rounded-xl border-0 px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-slate-200"
            />
          </label>

          <button
            type="submit"
            disabled={!file || submitting}
            className="flex h-12 items-center justify-center rounded-full bg-[#13294b] text-base font-semibold text-white transition-colors hover:bg-[#1c3a68] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "생성 중..." : "커스텀 보이스 생성"}
          </button>
        </form>

        {error && (
          <pre className="mt-6 overflow-x-auto whitespace-pre-wrap rounded-xl bg-red-50 p-4 text-xs text-red-700">
            {error}
          </pre>
        )}

        {result != null && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="mb-2 text-sm font-semibold text-emerald-800">생성 완료!</p>
            {voiceId && (
              <p className="mb-2 break-all rounded-lg bg-white px-3 py-2 font-mono text-sm text-slate-900">
                {voiceId}
              </p>
            )}
            <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-emerald-900">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
