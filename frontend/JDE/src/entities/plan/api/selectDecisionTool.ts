import customAxios from "@/shared/api/http";
import type { AxiosResponse } from "axios";

type SelectToolRequest = number[]; // 식당 ID 배열

type SelectToolResponse = {
  planId: number;
  toolType: "VOTE" | "LADDER" | "ROULETTE";
  status: string;
  finalRestaurantId: number;
  startedAt: string;
  closedAt: string;
  createdBy: number;
};

type SelectToolApiResponse = {
  status: string;
  code: string;
  message: string;
  data: SelectToolResponse;
};

export async function selectDecisionTool(
  planId: string,
  toolType: "VOTE" | "LADDER" | "ROULETTE",
  restaurantIds: number[]
): Promise<SelectToolResponse> {
  const response = await customAxios<AxiosResponse<SelectToolApiResponse>>({
    method: "POST",
    url: `/plans/${planId}/tool`,
    params: { type: toolType },
    data: restaurantIds,
    meta: { authRequired: true },
  });

  if (response.data?.status !== "OK" && response.data?.status !== "100 CONTINUE") {
    throw new Error(
      response.data?.message || "결정 도구 선택에 실패했습니다."
    );
  }

  if (!response.data?.data) {
    throw new Error("결정 도구 선택 응답 데이터가 없습니다.");
  }

  return response.data.data;
}

