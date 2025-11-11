import { Search, ChevronLeft, Home } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Logo } from "@/shared/ui/Logo";
import type {
  TopNavBarAllProps,
  DefaultTopNavBarProps,
  AuthTopNavBarProps,
  SearchTopNavBarProps,
  LabelTopNavBarProps,
  SimpleTopNavBarProps,
} from "../model/types";

/**
 * 상단 네비게이션 바
 * 페이지별로 다른 UI를 제공하는 6가지 variant 지원
 */
export const TopNavBar = (props: TopNavBarAllProps) => {
  const { variant = "default", className } = props;

  // 공통 컨테이너 스타일
  const containerClass = cn(
    "py-2 px-5 flex items-center bg-white border-b border-gray-200",
    "sticky top-0 z-50",
    className
  );

  /**
   * Default variant: 로고 + 검색
   * 메인, 모임, 즐겨찾기 페이지
   */
  if (variant === "default") {
    const { onSearchClick } = props as DefaultTopNavBarProps;

    return (
      <header className={containerClass}>
        <Logo size="md" />

        <div className="ml-auto flex items-center">
          <button
            onClick={onSearchClick}
            aria-label="검색"
            className="text-gray-700 hover:text-gray-900 transition-colors"
          >
            <Search className="w-6 h-6" strokeWidth={2} />
          </button>
        </div>
      </header>
    );
  }

  /**
   * Auth variant: 뒤로가기 + 제목
   * 로그인, 회원가입 페이지
   */
  if (variant === "auth") {
    const { label, onBack } = props as AuthTopNavBarProps;

    return (
      <header className={containerClass}>
        <button
          onClick={onBack}
          aria-label="뒤로가기"
          className="text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2} />
        </button>
        <h1 className="ml-4 text-lg font-semibold text-gray-900">{label}</h1>
      </header>
    );
  }

  /**
   * Search variant: 뒤로가기 + 검색 입력창 + 검색
   * 검색어 입력, 검색 페이지
   */
  if (variant === "search") {
    const { searchValue, onSearchChange, onSearch, onBack } =
      props as SearchTopNavBarProps;

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
          <Search className="w-6 h-6" strokeWidth={2} />
        </button>
      </header>
    );
  }

  /**
   * Label variant: 페이지 라벨 + 검색
   * 마이, 약속, 결정도구(투표, 룰렛) 페이지
   */
  if (variant === "label") {
    const { label, onSearchClick } = props as LabelTopNavBarProps;

    return (
      <header className={containerClass}>
        <h1 className="text-xl font-semibold text-gray-900">{label}</h1>

        <div className="ml-auto flex items-center">
          <button
            onClick={onSearchClick}
            aria-label="검색"
            className="text-gray-700 hover:text-gray-900 transition-colors"
          >
            <Search className="w-6 h-6" strokeWidth={2} />
          </button>
        </div>
      </header>
    );
  }

  /**
   * Simple variant: 뒤로가기 + 홈 + 검색
   * 개인추천 피드, 식당 상세 페이지
   */
  if (variant === "simple") {
    const {
      onBack,
      onHomeClick,
      onSearchClick,
      showHomeButton = true,
    } = props as SimpleTopNavBarProps;

    // Simple variant는 투명 배경, 보더 없음
    const simpleContainerClass = cn(
      "py-2 px-5 flex items-center bg-transparent",
      "sticky top-0 z-50",
      className
    );

    // 원형 버튼 공통 스타일
    const circularButtonClass =
      "p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all";

    return (
      <header className={simpleContainerClass}>
        {/* 왼쪽: 뒤로가기 + 홈 */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="뒤로가기"
            className={circularButtonClass}
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          </button>

          {/* 홈 버튼: 식당 상세에만 표시 */}
          {showHomeButton && (
            <button
              onClick={onHomeClick}
              aria-label="홈"
              className={circularButtonClass}
            >
              <Home className="w-5 h-5" strokeWidth={2} />
            </button>
          )}
        </div>

        {/* 오른쪽: 검색 */}
        <div className="ml-auto">
          <button
            onClick={onSearchClick}
            aria-label="검색"
            className={circularButtonClass}
          >
            <Search className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      </header>
    );
  }

  /**
   * None variant: 네비바 없음
   * 온보딩 페이지
   */
  if (variant === "none") {
    return null;
  }

  return null;
};
