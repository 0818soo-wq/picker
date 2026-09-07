"use client";

import { useState } from "react";
import EventBanner from "@/components/EventBanner";

type Status = "idle" | "submitting" | "success" | "error";
type GroupType = "draw" | "no_draw";
type LookupState = "idle" | "checking" | "found" | "not_found";

const CONTENT_ROWS = 9;
const MAX_CONTENT_LENGTH = 2000;
const MAX_EMPLOYEE_ID_LENGTH = 20;

export default function EntryForm({ groupType }: { groupType: GroupType }) {
  const [employeeId, setEmployeeId] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [lookupState, setLookupState] = useState<LookupState>("idle");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [confirmedFor, setConfirmedFor] = useState<string | null>(null);
  const [resolved, setResolved] = useState<{ department: string; name: string } | null>(null);

  const isConfirmed = lookupState === "found" && confirmedFor === employeeId.trim();

  function handleEmployeeIdChange(value: string) {
    setEmployeeId(value);
    // 사번을 다시 수정하면 이전 조회 결과는 더 이상 유효하지 않으므로 초기화합니다.
    if (lookupState !== "idle") {
      setLookupState("idle");
      setResolved(null);
      setLookupError(null);
    }
  }

  async function handleLookup() {
    const id = employeeId.trim();
    if (!id) return;

    setLookupState("checking");
    setLookupError(null);

    try {
      const res = await fetch("/api/entries/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: id }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setLookupState("not_found");
        setLookupError(data?.error ?? "사번을 확인할 수 없습니다.");
        setResolved(null);
        return;
      }

      setResolved({ department: data.department, name: data.name });
      setConfirmedFor(id);
      setLookupState("found");
    } catch {
      setLookupState("not_found");
      setLookupError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
      setResolved(null);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    if (!isConfirmed) {
      setErrorMessage("사번 확인을 먼저 눌러주세요.");
      return;
    }
    if (!content.trim()) {
      setErrorMessage("내용을 입력해 주세요.");
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      let res = await submitEntry(false);

      if (res.status === 409) {
        const dupData = await res.json().catch(() => ({}));
        if (dupData?.duplicate) {
          const wantsReplace = window.confirm(
            "같은 분이 이미 접수한 내역이 있습니다. 이전 접수를 삭제하고 재등록하시겠습니까?\n\n확인: 재등록 (기존 접수 삭제)\n취소: 기존 접수 유지"
          );
          if (!wantsReplace) {
            setStatus("success");
            return;
          }
          res = await submitEntry(true);
        }
      }

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

  function submitEntry(replaceExisting: boolean) {
    return fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: employeeId.trim(),
        content: content.trim(),
        groupType,
        replaceExisting,
      }),
    });
  }

  if (status === "success") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-[#f5f5f7] px-6 py-24 text-center">
        <div className="text-5xl">✅</div>
        <h1 className="text-2xl font-bold text-slate-900">접수가 잘 되었습니다.</h1>
        <p className="text-slate-600">CSM을 위한 축의 전환을 이뤄내시길 기원합니다!</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center bg-[#f5f5f7] px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl">
        <EventBanner />

        <form onSubmit={handleSubmit} className="flex flex-col gap-8 px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              사번
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  maxLength={MAX_EMPLOYEE_ID_LENGTH}
                  value={employeeId}
                  onChange={(e) => handleEmployeeIdChange(e.target.value)}
                  placeholder="사번을 입력하세요"
                  className="min-w-0 flex-1 border-b-2 border-slate-300 bg-transparent px-1 py-2 text-base text-slate-900 outline-none focus:border-[#13294b]"
                />
                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={!employeeId.trim() || lookupState === "checking"}
                  className="shrink-0 rounded-full bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {lookupState === "checking" ? "확인 중..." : "확인"}
                </button>
              </div>
            </label>

            {isConfirmed && resolved && (
              <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                {resolved.department} / {resolved.name}님, 아래 내용을 작성 후 제출해 주세요.
              </p>
            )}
            {lookupState === "not_found" && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{lookupError}</p>
            )}
          </div>

          <div className={isConfirmed ? "" : "pointer-events-none opacity-40"}>
            <p className="-mb-4 mt-0 text-xs text-slate-400">
              나의 부서를 위한 마음을 담아 정성들여서 써주세요.
            </p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
              placeholder="사번 확인 후 이곳에 자유롭게 의견을 적어주세요."
              rows={CONTENT_ROWS}
              disabled={!isConfirmed}
              className="mt-4 w-full resize-none bg-transparent text-slate-900 outline-none placeholder:text-slate-300"
              style={{
                lineHeight: "2.5rem",
                backgroundImage:
                  "repeating-linear-gradient(to bottom, transparent 0, transparent 2.4rem, #d9dee6 2.4rem, #d9dee6 calc(2.4rem + 1px))",
              }}
            />
          </div>

          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={status === "submitting" || !isConfirmed}
            className="flex h-12 items-center justify-center rounded-full bg-[#13294b] px-8 text-base font-semibold text-white transition-colors hover:bg-[#1c3a68] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "submitting" ? "접수 중..." : "제출하기"}
          </button>
        </form>
      </div>
    </main>
  );
}
