// 목적: 특정 약속(plan)에 대해 "최종 선택된 식당"을 서버에 PATCH로 전달
// 사용 위치: 룰렛 onFinish, 투표 완료 등에서 공통으로 사용할 수 있음

import customAxios from "@/shared/api/http";

export async function rouletteResultRestaurant(
  planId: string | number,
  restaurantId: number
): Promise<void> {
  await customAxios({
    method: "PATCH",
    url: `/plans/${planId}/decision`,
    data: { restaurantId },
    meta: { authRequired: true },
  });
}
