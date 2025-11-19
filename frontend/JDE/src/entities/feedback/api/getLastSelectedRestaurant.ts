/**
 * 최근 선택 식당 조회 API
 * 피드백 배너에서 사용하는 최근 선택 식당 조회 API
 */

import httpClient from "@/shared/api/http";

/**
 * 최근 선택 식당 응답 타입
 */
export type LastSelectedRestaurantResponse = {
  restaurantId: number;
  name: string;
};

/**
 * 사용자가 가장 최근에 SELECT 액션으로 선택한 식당을 조회합니다.
 * 선택한지 하루(24시간) 이상 지난 경우만 반환합니다.
 * 없으면 204 No Content를 반환합니다.
 *
 * @returns 최근 선택 식당 정보 또는 null (204인 경우)
 * @throws 에러 발생 시
 */
export async function getLastSelectedRestaurant(): Promise<LastSelectedRestaurantResponse | null> {
  try {
    const response = await httpClient({
      method: "GET",
      url: "/main/restaurants/last-selected",
      meta: { authRequired: true },
    });

    // 204 No Content인 경우 (axios는 204를 성공으로 처리하지만 data가 비어있음)
    if (response.status === 204 || !response.data) {
      return null;
    }

    return response.data as LastSelectedRestaurantResponse;
  } catch (error: any) {
    // 204 No Content인 경우 null 반환 (일부 경우 catch로 올 수 있음)
    if (error?.response?.status === 204) {
      return null;
    }
    // 다른 에러는 그대로 throw
    throw error;
  }
}
