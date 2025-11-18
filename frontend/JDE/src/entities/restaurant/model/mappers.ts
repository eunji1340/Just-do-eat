/**
 * 식당 데이터 변환 함수
 * - API 응답을 UI 컴포넌트용 타입으로 변환
 */

import type {
  RestaurantSearchResponse,
  Restaurant,
  BookmarkRestaurantResponse,
} from "../types";

/**
 * 검색 API 응답을 Restaurant 타입으로 변환
 * @param api - 검색 API 응답 데이터
 * @returns Restaurant 타입 객체
 */
export function mapSearchResponseToRestaurant(
  api: RestaurantSearchResponse
): Restaurant {
  // 가격대 변환: LOW → ₩, MEDIUM → ₩₩, HIGH → ₩₩₩, PREMIUM → ₩₩₩₩
  const priceRangeMap: Record<string, string> = {
    LOW: "₩",
    MEDIUM: "₩₩",
    HIGH: "₩₩₩",
    PREMIUM: "₩₩₩₩",
  };

  return {
    restaurant_id: api.restaurant_id,
    name: api.name,
    address: api.address || "",
    phone: "", // API에 없는 필드 - 기본값
    summary: "", // API에 없는 필드 - 기본값

    // 이미지: 단일 문자열 → 배열로 변환
    image: api.image ? [api.image] : [],

    // 카테고리: 가장 구체적인 것 선택 (category3 > category2 > category1)
    category: api.category3 || api.category2 || api.category1,

    // 평점
    rating: api.kakao_rating,

    // 가격대 변환
    price_range: priceRangeMap[api.price_range] || "₩₩",

    // API에 없는 필드 - 기본값
    website_url: "",
    menu: [], // 검색 결과에는 메뉴 정보 없음
    distance_m: 0, // 검색 결과에는 거리 정보 없음
    is_open: true, // 기본값: 영업 중
  };
}

/**
 * 즐겨찾기 API 응답을 Restaurant 타입으로 변환
 * (GET /restaurants/bookmarks)
 * @param api - 즐겨찾기 API 응답 데이터
 * @returns Restaurant 타입 객체
 */
export function mapBookmarkResponseToRestaurant(
  api: BookmarkRestaurantResponse
): Restaurant {
  return {
    restaurant_id: api.restaurant_id,
    name: api.name,
    address: "", // 북마크 응답에 없는 필드 - 기본값
    phone: "", // 북마크 응답에 없는 필드 - 기본값
    summary: "", // 북마크 응답에 없는 필드 - 기본값

    // 이미지: 이미 배열 형태
    image: api.image ?? [],

    // 카테고리: 가장 구체적인 것 선택 (category3 > category2 > category1)
    category: api.category3 || api.category2 || api.category1 || "기타",

    // 평점 (북마크 응답에 없음)
    rating: 0,

    // 가격대 (북마크 응답에 없음)
    price_range: "₩₩",

    // API에 없는 필드 - 기본값
    website_url: "",
    menu: api.menu.map((m) => ({
      name: m.name,
      price: m.price,
    })),
    distance_m: 0,
    is_open: true,
  };
}
