/**
 * 방문 피드백 제출 API
 */

import httpClient from "@/shared/api/http";

/**
 * 방문 피드백 요청 타입
 */
export type VisitFeedbackRequest = {
  isVisited: boolean;
  satisfaction?: "LIKE" | "NEUTRAL" | "DISLIKE";
};

/**
 * 방문 피드백 응답 타입
 */
export type VisitFeedbackResponse = {
  userId: number;
  restaurantId: number;
  isVisited: boolean;
  prefScore: number;
};

/**
 * 방문 여부와 만족도를 기록하고 선호 점수를 업데이트합니다.
 *
 * @param restaurantId - 식당 ID
 * @param data - 방문 피드백 데이터
 * @returns 방문 피드백 응답
 */
export async function submitVisitFeedback(
  restaurantId: number,
  data: VisitFeedbackRequest
): Promise<VisitFeedbackResponse> {
  const response = await httpClient({
    method: "POST",
    url: `/main/restaurants/${restaurantId}/visit-feedback`,
    data,
    meta: { authRequired: true },
  });

  return response.data as VisitFeedbackResponse;
}
