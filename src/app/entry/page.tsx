"use client";

import { useRef, useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

const MAX_FILE_SIZE = 8 * 1024 * 1024;

export default function EntryPage() {
  const [department, setDepartment] = useState("");
  const [name, setName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreviewUrl(null);
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage("사진 용량은 8MB 이하여야 합니다.");
      e.target.value = "";
      return;
    }

    setErrorMessage(null);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    const form = e.currentTarget;
    const file = fileInputRef.current?.files?.[0];

    if (!department.trim() || !name.trim()) {
      setErrorMessage("소속과 이름을 입력해 주세요.");
      return;
    }
    if (!file) {
      setErrorMessage("사진을 선택해 주세요.");
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.set("department", department.trim());
      formData.set("name", name.trim());
      formData.set("photo", file);

      const res = await fetch("/api/entries", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data?.error ?? "접수 중 오류가 발생했습니다.");
        return;
      }

      setStatus("success");
      form.reset();
      setDepartment("");
      setName("");
      setPreviewUrl(null);
    } catch {
      setStatus("error");
      setErrorMessage("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    }
  }

  if (status === "success") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-6 py-24 text-center dark:bg-black">
        <div className="text-5xl">✅</div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">접수가 완료되었습니다!</h1>
        <p className="text-zinc-600 dark:text-zinc-400">추첨 결과를 기대해 주세요.</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 rounded-full border border-zinc-300 px-6 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          다시 접수하기
        </button>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-12 dark:bg-black">
      <div className="w-full max-w-md">
        <h1 className="mb-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">사진 접수</h1>
        <p className="mb-8 text-sm text-zinc-600 dark:text-zinc-400">
          우리 조직에 필요한 변화를 담은 사진과 정보를 입력해 주세요.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="department" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              소속
            </label>
            <input
              id="department"
              name="department"
              type="text"
              required
              maxLength={100}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="예: 마케팅팀"
              className="rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-300"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              이름
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 홍길동"
              className="rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-300"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="photo" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              사진
            </label>
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              required
              ref={fileInputRef}
              onChange={handleFileChange}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none file:mr-4 file:rounded-full file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:file:bg-white dark:file:text-zinc-900"
            />
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="선택한 사진 미리보기"
                className="mt-2 h-48 w-full rounded-lg object-cover"
              />
            )}
          </div>

          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="mt-2 flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-base font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {status === "submitting" ? "접수 중..." : "접수하기"}
          </button>
        </form>
      </div>
    </main>
  );
}
