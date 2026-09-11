"use client";

import { useEffect, useState } from "react";
import EventBanner from "@/components/EventBanner";

type Status = "idle" | "submitting" | "success" | "error";
type GroupType = "draw" | "no_draw";
type LookupState = "idle" | "checking" | "found" | "not_found";
type EntriesOpenState = "open" | "closed";

const CONTENT_ROWS = 9;
const MAX_CONTENT_LENGTH = 2000;
const MAX_EMPLOYEE_ID_LENGTH = 20;

export default function EntryForm({ groupType }: { groupType: GroupType }) {
  // 접수 마감 여부를 서버에 확인하는 동안 폼 전체를 가리고 "불러오는 중..."만
  // 보여주면, 그 응답을 기다리는 시간만큼 페이지가 느리게 느껴집니다. 접수는
  // 거의 항상 열려있는 상태이므로, 우선 열린 것으로 보고 폼을 바로 보여주고
  // 뒤에서 확인해 실제로 마감된 경우에만 화면을 바꿉니다.
  const [entriesOpen, setEntriesOpen] = useState<EntriesOpenState>("open");
  const [editIntent, setEditIntent] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [content, setContent] = useState("");
  const [reviewMode, setReviewMode] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState(
    "CSM을 위한 축의 전환을 이뤄내시길 기원합니다!"
  );
  const [editNotice, setEditNotice] = useState<string | null>(null);

  const [lookupState, setLookupState] = useState<LookupState>("idle");
  const [confirmedFor, setConfirmedFor] = useState<string | null>(null);
  const [resolved, setResolved] = useState<{
    department: string;
    name: string;
    titleSuffix: string;
    eligible: boolean;
  } | null>(null);
  const [manualDepartment, setManualDepartment] = useState("");
  const [manualName, setManualName] = useState("");

  const isConfirmed = lookupState === "found" && confirmedFor === employeeId.trim();
  const isManualMode = lookupState === "not_found" && confirmedFor === employeeId.trim();
  const isManualReady = isManualMode && manualDepartment.trim() !== "" && manualName.trim() !== "";
  const canWrite = isConfirmed || isManualReady;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/entries/status", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setEntriesOpen(data?.open === false ? "closed" : "open");
      })
      .catch(() => {
        if (!cancelled) setEntriesOpen("open");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleToggleEditIntent() {
    setEditIntent((prev) => !prev);
    setEmployeeId("");
    setContent("");
    setLookupState("idle");
    setResolved(null);
    setManualDepartment("");
    setManualName("");
    setEditNotice(null);
    setErrorMessage(null);
  }

  function handleEmployeeIdChange(value: string) {
    setEmployeeId(value);
    // 사번을 다시 수정하면 이전 조회 결과는 더 이상 유효하지 않으므로 초기화합니다.
    if (lookupState !== "idle") {
      setLookupState("idle");
      setResolved(null);
      setManualDepartment("");
      setManualName("");
      setEditNotice(null);
    }
  }

  async function handleLookup() {
    const id = employeeId.trim();
    if (!id) return;

    setLookupState("checking");

    try {
      const res = await fetch("/api/entries/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: id }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // 명단에서 조회되지 않는 사번입니다. 재입력을 강제하지 않고, 소속/이름을
        // 직접 입력해서 의견 제출을 계속할 수 있게 해줍니다.
        setResolved(null);
        setConfirmedFor(id);
        setLookupState("not_found");
        return;
      }

      setResolved({
        department: data.department,
        name: data.name,
        titleSuffix: data.titleSuffix,
        eligible: data.eligible !== false,
      });
      setConfirmedFor(id);
      setLookupState("found");

      if (editIntent) {
        await loadMyEntry(id);
      }
    } catch {
      setResolved(null);
      setConfirmedFor(id);
      setLookupState("not_found");
    }
  }

  async function loadMyEntry(id: string) {
    try {
      const res = await fetch("/api/entries/mine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: id, groupType }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.content) {
        setContent(data.content);
        setEditNotice("기존에 작성하신 내용을 불러왔습니다. 수정 후 다시 제출해 주세요.");
      } else {
        setContent("");
        setEditNotice("기존 접수 내역이 없습니다. 새로 작성해 주세요.");
      }
    } catch {
      setEditNotice("기존 접수 내용을 불러오지 못했습니다. 다시 시도해 주세요.");
    }
  }

  function handleReviewSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canWrite) {
      setErrorMessage(
        isManualMode ? "소속과 이름을 입력해 주세요." : "사번 확인을 먼저 눌러주세요."
      );
      return;
    }
    if (!content.trim()) {
      setErrorMessage("내용을 입력해 주세요.");
      return;
    }
    setErrorMessage(null);
    setReviewMode(true);
  }

  async function handleConfirmSubmit() {
    if (status === "submitting") return;

    setStatus("submitting");
    setErrorMessage(null);

    try {
      let res = await submitEntry(editIntent);

      if (res.status === 409) {
        const dupData = await res.json().catch(() => ({}));
        if (dupData?.duplicate) {
          const wantsReplace = window.confirm(
            "이미 작성하셨습니다. 기존 작성카드를 지우고 새로 작성하시겠습니까?\n\n확인: 새로 작성 (기존 카드 삭제)\n취소: 기존 카드 유지"
          );
          if (!wantsReplace) {
            setSuccessMessage("기존 작성 카드로 접수가 잘 되어있습니다. 감사합니다.");
            setStatus("success");
            return;
          }
          res = await submitEntry(true);
        }
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setReviewMode(false);
        setErrorMessage(data?.error ?? "접수 중 오류가 발생했습니다.");
        return;
      }

      if (editIntent) {
        setSuccessMessage("수정하신 내용으로 접수가 잘 되었습니다. 감사합니다.");
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setReviewMode(false);
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
        manualDepartment: isManualMode ? manualDepartment.trim() : undefined,
        manualName: isManualMode ? manualName.trim() : undefined,
      }),
    });
  }

  if (entriesOpen === "closed") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-[#f5f5f7] px-6 py-24 text-center">
        <div className="text-5xl">🙏</div>
        <h1 className="text-2xl font-bold text-slate-900">접수가 마감되었습니다. 감사합니다.</h1>
      </main>
    );
  }

  if (status === "success") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-[#f5f5f7] px-6 py-24 text-center">
        <div className="text-5xl">✅</div>
        <h1 className="text-2xl font-bold text-slate-900">접수가 잘 되었습니다.</h1>
        <p className="text-slate-600">{successMessage}</p>
      </main>
    );
  }

  if (reviewMode) {
    return (
      <main className="flex flex-1 flex-col items-center bg-[#f5f5f7] px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl">
          <EventBanner
            badge="접수 내용 확인"
            titleLine1="아래 내용으로 접수할까요?"
            titlePrefix=""
            titleHighlight=""
            titleSuffix=""
            subtitleLine1="제출 전 마지막으로 한 번 더 확인해 주세요."
            subtitleLine2=""
          />

          <div className="flex flex-col gap-6 px-6 py-8 sm:px-10 sm:py-10">
            <div className="rounded-2xl border border-slate-200 bg-[#fbfbfd] px-5 py-5">
              <p className="mb-3 text-sm font-semibold text-slate-500">
                {isManualMode ? (
                  <>
                    {manualDepartment} {manualName}
                  </>
                ) : (
                  <>
                    {resolved?.department} {resolved?.name}
                    {resolved?.titleSuffix}
                  </>
                )}
              </p>
              <p
                className="whitespace-pre-wrap text-base leading-relaxed text-slate-900"
                style={{ lineHeight: "2.2rem" }}
              >
                {content}
              </p>
            </div>

            <p className="text-center text-sm font-medium text-slate-600">
              위 내용으로 접수합니다. 감사합니다.
            </p>

            {errorMessage && (
              <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{errorMessage}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setReviewMode(false)}
                disabled={status === "submitting"}
                className="flex h-12 flex-1 items-center justify-center rounded-full bg-slate-100 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                다시 작성하기
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={status === "submitting"}
                className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#13294b] text-base font-semibold text-white transition-colors hover:bg-[#1c3a68] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "submitting" ? "접수 중..." : "접수하기"}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center bg-[#f5f5f7] px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl">
        <EventBanner />

        <div className="flex justify-end px-6 pt-4 sm:px-10">
          <button
            type="button"
            onClick={handleToggleEditIntent}
            className="text-xs font-medium text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
          >
            {editIntent ? "새로 작성하기로 전환" : "기존에 접수한 내용 수정하기"}
          </button>
        </div>

        <form onSubmit={handleReviewSubmit} className="flex flex-col gap-8 px-6 py-8 sm:px-10 sm:py-10">
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

            {isConfirmed && resolved && resolved.eligible && (
              <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm leading-relaxed text-blue-700">
                {resolved.department} {resolved.name}
                {resolved.titleSuffix}
                <br />
                {editIntent ? "아래 내용을 수정 후 제출버튼을 눌러주세요." : "아래 내용을 작성 후 제출버튼을 눌러주세요."}
              </p>
            )}
            {isConfirmed && resolved && !resolved.eligible && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-700">
                이벤트 대상자가 아닙니다. 추첨에서는 제외되지만, 의견 제출은 가능합니다.
              </p>
            )}
            {editNotice && (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-600">
                {editNotice}
              </p>
            )}
            {isManualMode && (
              <div className="flex flex-col gap-3 rounded-lg bg-amber-50 px-3 py-3 text-sm leading-relaxed text-amber-700">
                <p>
                  전략회의 참석대상자의 사번이 아닙니다. 사번을 다시 확인해주세요.
                  <br />
                  참석대상자가 아니어도 아래에 소속과 이름을 직접 입력해 의견을 제출하실 수 있습니다.
                  <br />
                  (단, 이 경우 추첨대상에서는 제외됩니다)
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={manualDepartment}
                    onChange={(e) => setManualDepartment(e.target.value.slice(0, 30))}
                    placeholder="소속을 입력하세요"
                    className="min-w-0 flex-1 rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-amber-200 focus:ring-2 focus:ring-amber-400"
                  />
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value.slice(0, 30))}
                    placeholder="이름을 입력하세요"
                    className="min-w-0 flex-1 rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-amber-200 focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>
            )}
          </div>

          <div className={canWrite ? "" : "pointer-events-none opacity-40"}>
            <p className="-mb-4 mt-0 text-xs text-slate-400">
              나의 부서를 위한 마음을 담아 정성들여서 써주세요.
            </p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
              placeholder="사번 확인 후 이곳에 자유롭게 의견을 적어주세요."
              rows={CONTENT_ROWS}
              disabled={!canWrite}
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
            disabled={status === "submitting" || !canWrite}
            className="flex h-12 items-center justify-center rounded-full bg-[#13294b] px-8 text-base font-semibold text-white transition-colors hover:bg-[#1c3a68] disabled:cursor-not-allowed disabled:opacity-60"
          >
            제출하기
          </button>
        </form>
      </div>
    </main>
  );
}
