// ============================================
// UI/기존 타입 (유지)
// ============================================

export type MenuItem = {
  name: string
  price: number
}

export type Restaurant = {
  restaurant_id: number
  name: string
  address: string
  phone: string
  summary: string
  image: string[]
  category: string
  rating: number
  price_range: string
  website_url: string
  menu: MenuItem[]
  distance_m: number
  is_open: boolean
}

// ============================================
// API 요청/응답 타입 (GET /restaurants)
// ============================================

/**
 * 검색 요청 파라미터
 */
export type SearchRestaurantParams = {
  // 기본 검색
  query?: string
  page?: number
  size?: number
  // 위치 필터
  lat?: number
  lng?: number
  meters?: number
  // 조건 필터
  priceRange?: "LOW" | "MEDIUM" | "HIGH" | "PREMIUM"
  openStatus?: "OPEN"
  tag?: string
}

/**
 * 검색 API 응답 - 식당 정보
 */
export type RestaurantSearchResponse = {
  restaurant_id: number
  kakao_id: number | null
  name: string
  address: string
  category1: string
  category2: string
  category3: string
  kakao_rating: number
  kakao_review_cnt: number
  price_range: "LOW" | "MEDIUM" | "HIGH" | "PREMIUM"
  image: string | null
}

// ============================================
// API 응답 타입 (GET /restaurants/bookmarks)
// ============================================

/**
 * 즐겨찾기 API 응답 - 메뉴 정보
 */
export type BookmarkMenuResponse = {
  name: string
  price: number
  is_recommend: boolean
  is_ai_mate: boolean
}

/**
 * 즐겨찾기 API 응답 - 식당 정보
 */
export type BookmarkRestaurantResponse = {
  restaurant_id: number
  name: string
  category1: string
  category2: string
  category3: string
  menu: BookmarkMenuResponse[]
  saved_count: number
  image: string[]
}

/**
 * 페이징 응답 구조
 *
 * ※ 북마크 API는 여기에 없는 필드(pageable, sort 등)도 더 내려주는데,
 *    타입은 "필수로 쓰는 필드만" 정의해둔 상태라 그대로 재사용해도 됨.
 */
export type PageResponse<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  numberOfElements: number
  empty: boolean
}
