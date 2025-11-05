/**
 * TopNavBar variant 타입
 * - default: 기본 (로고 + 검색 + 알림)
 * - auth: 인증 페이지 (뒤로가기 + 제목)
 * - search: 검색 페이지 (뒤로가기 + 검색 입력창 + 검색 버튼)
 * - my: 마이 페이지 (마이 + 검색 + 알림)
 */
export type TopNavBarVariant = "default" | "auth" | "search" | "my";

/**
 * TopNavBar 공통 Props
 */
export interface TopNavBarProps {
  /** 네비바 variant */
  variant?: TopNavBarVariant;
  /** 추가 className */
  className?: string;
}

/**
 * Auth variant용 Props
 */
export interface AuthTopNavBarProps extends TopNavBarProps {
  variant: "auth";
  /** 페이지 제목 (예: "로그인", "회원가입") */
  title: string;
  /** 뒤로가기 핸들러 */
  onBack?: () => void;
}

/**
 * Search variant용 Props
 */
export interface SearchTopNavBarProps extends TopNavBarProps {
  variant: "search";
  /** 검색어 */
  searchValue?: string;
  /** 검색어 변경 핸들러 */
  onSearchChange?: (value: string) => void;
  /** 검색 실행 핸들러 */
  onSearch?: () => void;
  /** 뒤로가기 핸들러 */
  onBack?: () => void;
}

/**
 * Default/My variant용 Props
 */
export interface DefaultTopNavBarProps extends TopNavBarProps {
  variant?: "default" | "my";
  /** 검색 핸들러 */
  onSearchClick?: () => void;
  /** 알림 핸들러 (미구현) */
  onNotificationClick?: () => void;
}

/**
 * 모든 variant를 포괄하는 Union 타입
 */
export type TopNavBarAllProps =
  | DefaultTopNavBarProps
  | AuthTopNavBarProps
  | SearchTopNavBarProps;
