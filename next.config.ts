import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 공유용 짧은 링크: /br -> 지역단장 접수, /of -> 본사파트장 접수
  // (주소창에는 /br, /of 그대로 보이고, 내용만 기존 접수 페이지를 그대로 보여줍니다)
  async rewrites() {
    return [
      { source: "/br", destination: "/entry/leader" },
      { source: "/of", destination: "/entry/staff" },
    ];
  },
};

export default nextConfig;
