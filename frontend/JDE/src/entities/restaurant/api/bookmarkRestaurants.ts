/**
 * 즐겨찾기(북마크) 식당 목록 API
 */

import httpClient, { buildQueryString } from "@/shared/api/http";
import type {
  BookmarkRestaurantResponse,
  PageResponse,
} from "../types";

/**
 * 즐겨찾기 식당 목록 조회
 *
 * @param params - 페이징 파라미터 (page, size)
 * @returns 페이징된 즐겨찾기 식당 목록
 *
 * @example
 * const result = await getBookmarkRestaurants({ page: 0, size: 10 });
 * console.log(result.content);        // 즐겨찾기 식당 목록
 * console.log(result.totalElements);  // 전체 북마크 개수
 */
export async function getBookmarkRestaurants(
  params: { page?: number; size?: number } = {}
): Promise<PageResponse<BookmarkRestaurantResponse>> {
  const { page = 0, size = 10 } = params;

  // 쿼리 문자열 생성
  const queryString = buildQueryString({
    page,
    size,
  });

  console.log("🌐 [API] 즐겨찾기 요청:", { page, size, queryString });

  const response = await httpClient({
    method: "GET",
    url: `/restaurants/bookmarks?${queryString}`,
    meta: { authRequired: true }, // ✅ 로그인 필수 API
  });

  console.log("🌐 [API] 즐겨찾기 응답:", response);
  console.log("🌐 [API] response.data:", response.data);

  return response.data as PageResponse<BookmarkRestaurantResponse>;
}
