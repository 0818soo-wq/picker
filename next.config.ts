import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 접수 링크는 이제 하나로 통일되어 있습니다(/entry/leader). 지역단장/파트장
  // 구분 없이 누구나 같은 화면으로 접수하고, 추첨 대상 여부는 서버가 사번으로
  // 조회한 실제 직책(명단 기준)만으로 판단합니다. 예전에 나눠 공유했던 주소와
  // 짧은 링크(/br, /of)는 모두 그대로 동작하도록 이 화면으로 연결해 둡니다.
  async rewrites() {
    return [
      { source: "/br", destination: "/entry/leader" },
      { source: "/of", destination: "/entry/leader" },
      { source: "/entry/staff", destination: "/entry/leader" },
    ];
  },
};

export default nextConfig;
