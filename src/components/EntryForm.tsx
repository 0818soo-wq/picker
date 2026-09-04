"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";
type GroupType = "draw" | "no_draw";

const EVENT_BADGE = "CSM전략회의 소통의 장 1";
const EVENT_TITLE_LINE1 = "우리 조직의 새로운 축,";
const EVENT_TITLE_PREFIX = "어떠한 ";
const EVENT_TITLE_HIGHLIGHT = "‘축의 전환’";
const EVENT_TITLE_SUFFIX = "이 필요할까요?";
const EVENT_SUBTITLE_LINE1 = "변화하는 환경 속에서 우리 조직이 나아가야 할 방향을";
const EVENT_SUBTITLE_LINE2 = "함께 고민해주세요.";

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
        <div
          className="relative isolate overflow-hidden px-6 py-10 sm:px-10 sm:py-12"
          style={{ background: "linear-gradient(180deg, #eaf2fb 0%, #cfe0f2 45%, #9fb9d6 100%)" }}
        >
          <MountainBackdrop />
          <LightBeam className="absolute right-10 top-0 h-full w-1.5 sm:right-16" />
          <CompassIcon className="absolute left-2 top-1/2 hidden h-24 w-24 -translate-y-1/2 text-slate-700/60 sm:left-4 sm:block sm:h-28 sm:w-28" />

          <div className="relative z-10 flex flex-col gap-3 sm:ml-28">
            <span className="inline-flex w-fit items-center rounded-full bg-[#13294b] px-4 py-1.5 text-xs font-bold text-white sm:text-sm">
              {EVENT_BADGE}
            </span>
            <h1 className="text-2xl font-extrabold leading-snug text-slate-900 sm:text-3xl">
              {EVENT_TITLE_LINE1}
              <br />
              {EVENT_TITLE_PREFIX}
              <span className="text-blue-600">{EVENT_TITLE_HIGHLIGHT}</span>
              {EVENT_TITLE_SUFFIX}
            </h1>
            <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
              {EVENT_SUBTITLE_LINE1}
              <br />
              {EVENT_SUBTITLE_LINE2}
            </p>
          </div>
        </div>

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

function CompassIcon({ className }: { className?: string }) {
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

function MountainBackdrop() {
  return (
    <svg
      className="absolute inset-x-0 bottom-0 h-2/3 w-full text-[#7a95b8]"
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

function LightBeam({ className }: { className?: string }) {
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
