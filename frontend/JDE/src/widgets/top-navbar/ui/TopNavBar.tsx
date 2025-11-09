import * as React from "react";
import { Search, Bell, ChevronLeft } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Logo } from "@/shared/ui/Logo";
import type { TopNavBarAllProps, DefaultTopNavBarProps, AuthTopNavBarProps, SearchTopNavBarProps } from "../model/types";

/**
 * 상단 네비게이션 바
 * 페이지별로 다른 UI를 제공하는 variant 지원
 */
export const TopNavBar = (props: TopNavBarAllProps) => {
  const { variant = "default", className } = props;

  // variant에 따른 패딩 클래스
  const paddingClass = variant === "my" ? "px-5" : "px-4";

  // 공통 컨테이너 스타일
  const containerClass = cn(
    "h-[86px] pt-7 pb-3 flex items-center bg-white border-b border-gray-200",
    "sticky top-0 z-50",
    paddingClass,
    className
  );

  /**
   * Default variant: 로고 + 검색 + 알림
   */
  if (variant === "default") {
    const { onSearchClick, onNotificationClick } = props as DefaultTopNavBarProps;

    return (
      <header className={containerClass}>
        <Logo size="md" />

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={onSearchClick}
            aria-label="검색"
            className="text-gray-700 hover:text-gray-900 transition-colors"
          >
            <Search className="w-7 h-7" strokeWidth={3} />
          </button>
          <button
            onClick={onNotificationClick}
            aria-label="알림"
            className="text-gray-700 hover:text-gray-900 transition-colors"
            disabled
          >
            <Bell className="w-7 h-7" strokeWidth={3} />
          </button>
        </div>
      </header>
    );
  }

  /**
   * Auth variant: 뒤로가기 + 제목
   */
  if (variant === "auth") {
    const { title, onBack } = props as AuthTopNavBarProps;

    return (
      <header className={containerClass}>
        <button
          onClick={onBack}
          aria-label="뒤로가기"
          className="text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2} />
        </button>
        <h1 className="ml-4 text-lg font-semibold text-gray-900">{title}</h1>
      </header>
    );
  }

  /**
   * Search variant: 뒤로가기 + 검색 입력창 + 검색 버튼
   */
  if (variant === "search") {
    const { searchValue, onSearchChange, onSearch, onBack } = props as SearchTopNavBarProps;

    return (
      <header className={containerClass}>
        <button
          onClick={onBack}
          aria-label="뒤로가기"
          className="text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2} />
        </button>

        <input
          type="text"
          placeholder="검색어를 입력해주세요"
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch?.()}
          className="flex-1 mx-4 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          aria-label="검색어 입력"
        />

        <button
          onClick={onSearch}
          aria-label="검색 실행"
          className="text-gray-700 hover:text-gray-900 transition-colors"
        >
          <Search className="w-7 h-7" strokeWidth={3} />
        </button>
      </header>
    );
  }

  /**
   * My variant: 마이 + 검색 + 알림
   */
  if (variant === "my") {
    const { onSearchClick, onNotificationClick } = props as DefaultTopNavBarProps;

    return (
      <header className={containerClass}>
        <h1 className="text-xl font-bold text-gray-900">마이</h1>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={onSearchClick}
            aria-label="검색"
            className="text-gray-700 hover:text-gray-900 transition-colors"
          >
            <Search className="w-7 h-7" strokeWidth={3} />
          </button>
          <button
            onClick={onNotificationClick}
            aria-label="알림"
            className="text-gray-700 hover:text-gray-900 transition-colors"
            disabled
          >
            <Bell className="w-7 h-7" strokeWidth={3} />
          </button>
        </div>
      </header>
    );
  }

  return null;
};
