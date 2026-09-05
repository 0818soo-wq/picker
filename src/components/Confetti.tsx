"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#13294b", "#3b82f6", "#93c5fd", "#f4b400", "#ffffff"];
const PARTICLE_COUNT = 70;
const DURATION_MS = 2200;
const MAX_DPR = 2;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: "rect" | "circle";
};

// 당첨 발표 순간에만 터지는 가벼운 캔버스 색종이 효과입니다. 라이브러리 없이 구현했습니다.
export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
      y: window.innerHeight * 0.3,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -12 - 4,
      size: Math.random() * 7 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      shape: Math.random() > 0.5 ? "rect" : "circle",
    }));

    const gravity = 0.35;
    const startedAt = performance.now();
    let frameId: number;

    function frame(now: number) {
      const elapsed = now - startedAt;
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      const fadeStart = DURATION_MS * 0.7;
      const opacity = elapsed < fadeStart ? 1 : Math.max(0, 1 - (elapsed - fadeStart) / (DURATION_MS - fadeStart));

      ctx!.globalAlpha = opacity;

      for (const p of particles) {
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        ctx!.fillStyle = p.color;
        if (p.shape === "rect") {
          ctx!.save();
          ctx!.translate(p.x, p.y);
          ctx!.rotate((p.rotation * Math.PI) / 180);
          ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx!.restore();
        } else {
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      if (elapsed < DURATION_MS) {
        frameId = requestAnimationFrame(frame);
      }
    }

    frameId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60]"
    />
  );
}
