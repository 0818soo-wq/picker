"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { boostAudioVolume } from "@/lib/audioBoost";

// 눌렀을 때 사장님 목소리로 지정된 문구를 읽어주는 버튼입니다. children을 주면
// 기본 스피커 아이콘 대신 그 내용(예: 🎉 이모지)을 그대로 버튼으로 씁니다.
// 마운트되는 즉시 음성을 미리 받아둬서, 클릭 시 지연 없이 바로 재생됩니다.
export default function SpeakerButton({
  text,
  className,
  children,
}: {
  text: string;
  className?: string;
  children?: ReactNode;
}) {
  const preparedRef = useRef<{ url: string; audio: HTMLAudioElement } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (cancelled || !blob) return;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.preload = "auto";
        boostAudioVolume(audio);
        preparedRef.current = { url, audio };
      })
      .catch((err) => console.error("[speaker] 음성 준비 실패", err));

    return () => {
      cancelled = true;
      if (preparedRef.current) {
        URL.revokeObjectURL(preparedRef.current.url);
        preparedRef.current = null;
      }
    };
  }, [text]);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    const prepared = preparedRef.current;
    if (prepared) {
      prepared.audio.currentTime = 0;
      prepared.audio.play().catch((err) => {
        console.error("[speaker] 음성 재생 실패", err);
        window.alert("음성 재생에 실패했습니다. 다시 눌러 주세요.");
      });
      return;
    }
    // 폴백: 아직 준비되지 않았다면 그 자리에서 요청해 재생합니다.
    fetch("/api/admin/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })
      .then(async (res) => {
        if (!res.ok) {
          console.error("[speaker] 음성 생성 실패", res.status, await res.text().catch(() => ""));
          window.alert("음성 생성에 실패했습니다.");
          return null;
        }
        return res.blob();
      })
      .then((blob) => {
        if (!blob) return;
        const audio = new Audio(URL.createObjectURL(blob));
        boostAudioVolume(audio);
        audio.play().catch((err) => {
          console.error("[speaker] 음성 재생 실패", err);
          window.alert("음성 재생에 실패했습니다. 다시 눌러 주세요.");
        });
      })
      .catch((err) => {
        console.error("[speaker] 음성 요청 중 오류", err);
        window.alert("네트워크 오류로 음성을 재생할 수 없습니다.");
      });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="사장님 목소리로 축하 인사 듣기"
      title="사장님 목소리로 축하 인사 듣기"
      className={className}
    >
      {children ?? (
        <svg viewBox="0 0 24 24" className="h-full w-full p-1" fill="currentColor">
          <path d="M4 9v6h4l5 5V4L8 9H4z" />
          <path
            d="M16.5 8.5a5 5 0 0 1 0 7"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M18.8 6.2a8.5 8.5 0 0 1 0 11.6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />
        </svg>
      )}
    </button>
  );
}
