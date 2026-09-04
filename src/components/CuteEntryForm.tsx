"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import CuteEventBanner from "@/components/CuteEventBanner";

type Status = "idle" | "submitting" | "success" | "error";
type GroupType = "draw" | "no_draw";

const CONTENT_ROWS = 7;
const MAX_CONTENT_LENGTH = 2000;
const MAX_FIELD_LENGTH = 100;

const FIELD_LABELS: Record<GroupType, { department: string; name: string; departmentPlaceholder: string }> = {
  draw: { department: "지역단", name: "지역단장", departmentPlaceholder: "예: OO지역단" },
  no_draw: { department: "파트", name: "파트장", departmentPlaceholder: "예: OO파트" },
};

// /cute 경로 전용 디자인 비교 시안입니다. 실제 접수 화면(EntryForm)과 같은 API로 제출되며,
// 당근마켓 같은 둥글둥글하고 아기자기한 톤을 블루 컬러로 표현했습니다.
export default function CuteEntryForm({ groupType }: { groupType: GroupType }) {
  const labels = FIELD_LABELS[groupType];
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
      <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-[#eaf3ff] px-6 py-24 text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
          className="text-6xl"
        >
          🎉
        </motion.div>
        <h1 className="font-cute text-2xl text-blue-900">접수가 잘 되었어요!</h1>
        <p className="text-blue-900/60">CSM을 위한 축의 전환을 이뤄내시길 기원합니다 💙</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center bg-[#eaf3ff] px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-[0_8px_30px_rgba(59,130,246,0.12)]">
        <CuteEventBanner />

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-6 py-8 sm:px-10 sm:py-10">
          <p className="-mb-2 text-xs text-blue-400">
            🖊️ 나의 부서를 위한 마음을 담아 정성들여서 써주세요.
          </p>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
            placeholder="이곳에 자유롭게 의견을 적어주세요."
            rows={CONTENT_ROWS}
            required
            className="w-full resize-none rounded-2xl bg-blue-50/60 p-4 text-slate-900 outline-none ring-1 ring-blue-100 placeholder:text-blue-300 focus:ring-2 focus:ring-blue-400"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CuteField
              label={labels.department}
              value={department}
              onChange={setDepartment}
              placeholder={labels.departmentPlaceholder}
            />
            <CuteField
              label={labels.name}
              value={name}
              onChange={setName}
              placeholder="예: 홍길동"
              hint="직책 없이 이름만 입력하세요"
            />
          </div>

          {errorMessage && (
            <p className="rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-600">{errorMessage}</p>
          )}

          <motion.button
            type="submit"
            disabled={status === "submitting"}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex h-12 items-center justify-center rounded-full bg-blue-500 px-8 text-base font-bold text-white shadow-lg shadow-blue-200 transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "submitting" ? "접수 중..." : "제출하기 🐾"}
          </motion.button>

          <p className="-mt-2 text-center text-xs text-blue-400">추첨을 위해 실명을 정확히 적어주세요.</p>
        </form>
      </div>
    </main>
  );
}

function CuteField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-semibold text-blue-900">
      {label}
      <input
        type="text"
        required
        maxLength={MAX_FIELD_LENGTH}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-2xl bg-blue-50/60 px-4 py-2.5 text-base text-slate-900 outline-none ring-1 ring-blue-100 placeholder:text-blue-300 focus:ring-2 focus:ring-blue-400"
      />
      {hint && <span className="text-xs font-normal text-blue-400">{hint}</span>}
    </label>
  );
}
