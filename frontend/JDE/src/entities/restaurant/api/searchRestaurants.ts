/**
 * 식당 검색 API
 */

import httpClient, { buildQueryString } from "@/shared/api/http";
import type {
  SearchRestaurantParams,
  RestaurantSearchResponse,
  PageResponse,
} from "../types";

/**
 *
 * 식당 검색 API 호출
 *
 * @param params - 검색 파라미터 (query, page, size, 필터 등)
 * @returns 페이징된 식당 목록
 *
 * @example
 * const result = await searchRestaurants({ query: "치킨", page: 0, size: 20 });
 * console.log(result.content); // 식당 목록
 * console.log(result.totalElements); // 전체 개수
 */
export async function searchRestaurants(
  params: SearchRestaurantParams = {}
): Promise<PageResponse<RestaurantSearchResponse>> {
  // 기본값 설정
  const { query = "", page = 0, size = 20, ...filters } = params;

  // 쿼리 문자열 생성 (undefined/null/빈 문자열 자동 제외)
  const queryString = buildQueryString({
    query,
    page,
    size,
    ...filters,
  });

  console.log("🌐 [API] 검색 요청:", { query, page, size, queryString });

  // GET 요청
  const response = await httpClient({
    method: "GET",
    url: `/restaurants?${queryString}`,
    meta: { authRequired: false }, // 비로그인 사용 가능
  });

  console.log("🌐 [API] 검색 응답:", response);
  console.log("🌐 [API] response.data:", response.data);

  return response.data as PageResponse<RestaurantSearchResponse>;
}
