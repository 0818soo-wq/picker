"use client";

import { useState } from "react";
import EventBanner from "@/components/EventBanner";

type Status = "idle" | "submitting" | "success" | "error";
type GroupType = "draw" | "no_draw";

const CONTENT_ROWS = 9;
const MAX_CONTENT_LENGTH = 2000;
const MAX_FIELD_LENGTH = 100;

export default function EntryForm({ groupType }: { groupType: GroupType }) {
  const [department, setDepartment] = useState("");
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    if (!department.trim() || !name.trim() || !content.trim()) {
      setErrorMessage("모든 항목을 입력해 주세요.");
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: department.trim(),
          name: name.trim(),
          content: content.trim(),
          groupType,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data?.error ?? "접수 중 오류가 발생했습니다.");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    }
  }

  if (status === "success") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-slate-100 px-6 py-24 text-center">
        <div className="text-5xl">✅</div>
        <h1 className="text-2xl font-bold text-slate-900">접수가 완료되었습니다!</h1>
        <p className="text-slate-600">소중한 의견 감사합니다.</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center bg-slate-100 px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl">
        <EventBanner />

        <form onSubmit={handleSubmit} className="flex flex-col gap-8 px-6 py-8 sm:px-10 sm:py-10">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
            placeholder="이곳에 자유롭게 의견을 적어주세요."
            rows={CONTENT_ROWS}
            required
            className="w-full resize-none bg-transparent text-slate-900 outline-none placeholder:text-slate-300"
            style={{
              lineHeight: "2.5rem",
              backgroundImage:
                "repeating-linear-gradient(to bottom, transparent 0, transparent 2.4rem, #d9dee6 2.4rem, #d9dee6 calc(2.4rem + 1px))",
            }}
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <UnderlineField
              label="지역단/파트"
              value={department}
              onChange={setDepartment}
              placeholder="예: OO지역단"
            />
            <UnderlineField
              label="지역단장/파트장"
              value={name}
              onChange={setName}
              placeholder="이름"
            />
          </div>

          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="flex h-12 items-center justify-center rounded-full bg-[#13294b] px-8 text-base font-semibold text-white transition-colors hover:bg-[#1c3a68] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "submitting" ? "접수 중..." : "제출하기"}
          </button>
        </form>
      </div>
    </main>
  );
}

function UnderlineField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      {label}
      <input
        type="text"
        required
        maxLength={MAX_FIELD_LENGTH}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-b-2 border-slate-300 bg-transparent px-1 py-2 text-base text-slate-900 outline-none focus:border-[#13294b]"
      />
    </label>
  );
}
