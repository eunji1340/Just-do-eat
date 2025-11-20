import customAxios from "@/shared/api/http";
import type { AxiosResponse } from "axios";
import type { PlanCandidatesResponse } from "../model/types";

type PlanCandidatesApiResponse = PlanCandidatesResponse | {
  status?: string;
  code?: string;
  message?: string;
  data?: PlanCandidatesResponse;
};

export async function getPlanCandidates(
  planId: string,
  cursor: string | null = "0"
): Promise<PlanCandidatesResponse> {
  const cursorParam = cursor || "0";
  console.log("[getPlanCandidates] API 호출 - planId:", planId, "cursor:", cursorParam);
  const response = await customAxios<AxiosResponse<PlanCandidatesApiResponse>>({
    method: "GET",
    url: `/plans/${planId}/candidates`,
    params: { cursor: cursorParam },
    meta: { authRequired: true },
  });

  const responseData = response.data;

  // data 안에 있는 경우 (status, code, message로 감싸진 경우)
  if (responseData && typeof responseData === 'object' && 'data' in responseData && responseData.data) {
    return responseData.data;
  }

  // 직접 next_cursor와 items가 있는 경우
  if (responseData && typeof responseData === 'object' && ('next_cursor' in responseData || 'items' in responseData)) {
    return {
      next_cursor: (responseData as PlanCandidatesResponse).next_cursor ?? null,
      items: (responseData as PlanCandidatesResponse).items ?? [],
    };
  }

  throw new Error("약속 후보 식당을 불러오지 못했습니다.");
}

