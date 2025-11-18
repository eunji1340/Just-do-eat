import customAxios from "@/shared/api/http";
import type { AxiosResponse } from "axios";
import type { PlanDetailResponse } from "../model/types";

type PlanDetailApiResponse = {
  status: string;
  code: string;
  message: string;
  data: PlanDetailResponse;
};

export async function getPlanDetail(
  planId: string
): Promise<PlanDetailResponse> {
  const response = await customAxios<AxiosResponse<PlanDetailApiResponse>>({
    method: "GET",
    url: `/plans/${planId}`,
    meta: { authRequired: true },
  });

  if (response.data?.status !== "OK" || !response.data?.data) {
    throw new Error(response.data?.message || "약속 상세 정보를 불러오지 못했습니다.");
  }

  return response.data.data;
}

