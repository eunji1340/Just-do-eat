/**
 * UI용 식당 타입
 */
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

/**
 * API 응답 타입 (백엔드에서 받는 형식)
 * - 실제 API 응답 기반으로 작성
 */
export type RestaurantSearchResponse = {
  restaurant_id: number;
  kakao_id: number | null;
  name: string;
  address: string;
  category1: string;
  category2: string;
  category3: string | null;
  kakao_rating: number;
  kakao_review_cnt: number;
  price_range: "LOW" | "MEDIUM" | "HIGH" | "PREMIUM" | null;
  image: string | null;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  last: boolean;
};
