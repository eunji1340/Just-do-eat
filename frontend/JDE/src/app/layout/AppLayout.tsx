// 목적: 모든 페이지에 공통으로 적용되는 전역 레이아웃
// 최소 너비 320px, 최대 너비 640px, 중앙 정렬 + 양옆 회색 공백

import React from "react";
import { useLocation } from "react-router-dom";
import { BottomNavBar } from "@/shared/ui/navbar";

type Props = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: Props) {
  const location = useLocation();

  /**
   * BottomNavBar를 표시할 페이지 경로 패턴
   * - 홈, 모임, 즐겨찾기, 마이 페이지
   * - 모임 상세, 약속 상세 페이지
   */
  const shouldShowBottomNavBar = (): boolean => {
    const { pathname } = location;

    // 정확히 일치하는 경로들
    const exactPaths = ["/", "/favorites", "/my" ,"/groups"];
    if (exactPaths.includes(pathname)) {
      return true;
    }

    // 패턴 매칭이 필요한 경로들
    // 모임 상세: /groups/:id
    // 약속 상세: /groups/appointments/:id 또는 /meetings/:meetingId/appointments/:id
    const showPatterns = [
      /^\/groups\/[^/]+$/, // 모임 상세
      /^\/groups\/[^/]+\/appointments\/[^/]+$/, // 약속 상세 (모임 하위)
      /^\/appointments\/[^/]+$/, // 약속 상세 (독립)
    ];

    return showPatterns.some((pattern) => pattern.test(pathname));
  };

  // BottomNavBar 표시 여부
  const showNavBar = shouldShowBottomNavBar();

  return (
    <div className="min-h-screen flex justify-center">
      {/* 메인 콘텐츠 컨테이너: 모바일 전체 너비, sm 이상에서 max-w-[640px] */}
      <main
        className={`w-full min-w-[320px] sm:max-w-[640px] shadow-sm ${
          showNavBar ? "pb-[86px]" : ""
        }`}
      >
        {children}
      </main>

      {/* 조건부 렌더링: BottomNavBar */}
      {showNavBar && <BottomNavBar />}
    </div>
  );
}
