import { useLocation, useNavigate } from "react-router-dom";
import { Home, Users, Star, User } from "lucide-react";
import { TabButton } from "@/shared/ui/button";

/**
 * 하단 네비게이션 바
 * 홈, 모임, 즐겨찾기, 마이 탭 포함
 */

// 탭 정의
const tabs = [
  {
    icon: Home,
    label: "홈",
    path: "/",
  },
  {
    icon: Users,
    label: "모임",
    path: "/meetings",
  },
  {
    icon: Star,
    label: "즐겨찾기",
    path: "/favorites",
  },
  {
    icon: User,
    label: "마이",
    path: "/my",
  },
] as const;

export const BottomNavBar = () => {
  // 현재 경로 추적
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * 현재 경로와 탭 경로를 비교하여 활성 상태 확인
   * @param tabPath - 탭의 경로
   * @returns 활성화 여부
   */
  const isActive = (tabPath: string): boolean => {
    if (tabPath === "/") {
      // 홈은 정확히 일치할 때만 활성화
      return location.pathname === "/";
    }
    // 다른 탭은 경로가 시작할 때 활성화
    return location.pathname.startsWith(tabPath);
  };

  /**
   * 탭 클릭 핸들러
   * @param path - 이동할 경로
   */
  const handleTabClick = (path: string) => {
    navigate(path);
  };

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50  w-full min-w-[320px] sm:max-w-[640px] bg-card shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
      aria-label="하단 네비게이션"
    >
      <div className="flex h-full items-center justify-between px-5 pt-1 pb-4">
        {tabs.map((tab) => (
          <TabButton
            key={tab.path}
            icon={tab.icon}
            label={tab.label}
            isActive={isActive(tab.path)}
            onClick={() => handleTabClick(tab.path)}
            aria-label={`${tab.label} 페이지로 이동`}
          />
        ))}
      </div>
    </nav>
  );
};
