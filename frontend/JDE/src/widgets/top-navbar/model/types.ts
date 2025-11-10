/**
 * TopNavBar variant 타입
 * - default: 기본 (로고 + 검색) - 메인, 모임, 즐겨찾기
 * - auth: 인증 페이지 (뒤로가기 + 제목) - 로그인, 회원가입
 * - search: 검색 페이지 (뒤로가기 + 검색 입력창 + 검색) - 검색어 입력, 검색페이지
 * - label: 페이지 설명 (페이지 라벨 + 검색) - 마이, 약속, 결정도구(투표, 룰렛)
 * - simple: 간단 (뒤로가기 + 홈 + 검색) - 개인추천 피드, 식당 상세
 * - none: 없음 - 온보딩
 */
export type TopNavBarVariant =
  | "default"
  | "auth"
  | "search"
  | "label"
  | "simple"
  | "none";

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
 * Default variant용 Props
 * 로고 + 검색
 */
export interface DefaultTopNavBarProps extends TopNavBarProps {
  variant?: "default";
  /** 검색 핸들러 */
  onSearchClick?: () => void;
}

/**
 * Auth variant용 Props
 * 뒤로가기 + 제목
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
 * 뒤로가기 + 검색 입력창 + 검색
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
 * Label variant용 Props
 * 페이지 라벨 + 검색
 */
export interface LabelTopNavBarProps extends TopNavBarProps {
  variant: "label";
  /** 페이지 라벨 (예: "마이", "약속", "투표", "룰렛") */
  label: string;
  /** 검색 핸들러 */
  onSearchClick?: () => void;
}

/**
 * Simple variant용 Props
 * 뒤로가기 + 홈 + 검색
 */
export interface SimpleTopNavBarProps extends TopNavBarProps {
  variant: "simple";
  /** 뒤로가기 핸들러 */
  onBack?: () => void;
  /** 홈 핸들러 */
  onHomeClick?: () => void;
  /** 검색 핸들러 */
  onSearchClick?: () => void;
}

/**
 * None variant용 Props
 * 네비바 없음
 */
export interface NoneTopNavBarProps extends TopNavBarProps {
  variant: "none";
}

/**
 * 모든 variant를 포괄하는 Union 타입
 */
export type TopNavBarAllProps =
  | DefaultTopNavBarProps
  | AuthTopNavBarProps
  | SearchTopNavBarProps
  | LabelTopNavBarProps
  | SimpleTopNavBarProps
  | NoneTopNavBarProps;
