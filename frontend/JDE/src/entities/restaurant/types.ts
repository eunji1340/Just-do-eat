// ============================================
// UI/기존 타입 (유지)
// ============================================

export type MenuItem = {
  name: string;
  price: number;
};

export type HoursInfo = {
  dow: number; // 0=공휴일, 1=월, ... 7=일
  open: string; // "HH:mm:ss"
  close: string; // "HH:mm:ss"
  break_open: string | null;
  break_close: string | null;
  is_holiday: boolean;
};

export type Restaurant = {
  restaurant_id: number;
  name: string;
  address: string;
  phone: string;
  summary: string;
  image: string[];
  category: string;
  rating: number;
  price_range: string;
  website_url: string;
  menu: MenuItem[];
  distance_m: number;
  is_open: boolean;
  hours: HoursInfo[] | null;
};

// ============================================
// API 요청/응답 타입 (GET /restaurants)
// ============================================

/**
 * 검색 요청 파라미터
 */
export type SearchRestaurantParams = {
  // 기본 검색
  query?: string;
  page?: number;
  size?: number;
  // 위치 필터
  lat?: number;
  lng?: number;
  meters?: number;
  // 조건 필터
  priceRange?: "LOW" | "MEDIUM" | "HIGH" | "PREMIUM";
  openStatus?: "OPEN";
  tag?: string;
};

/**
 * 검색 API 응답 - 식당 정보
 */
export type RestaurantSearchResponse = {
  restaurant_id: number;
  kakao_id: number | null;
  name: string;
  address: string;
  category1: string;
  category2: string;
  category3: string;
  kakao_rating: number;
  kakao_review_cnt: number;
  price_range: "LOW" | "MEDIUM" | "HIGH" | "PREMIUM";
  image: string | null;
};

/**
 * 페이징 응답 구조
 */
export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
};
