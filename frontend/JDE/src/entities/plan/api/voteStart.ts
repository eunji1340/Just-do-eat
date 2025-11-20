import customAxios from "@/shared/api/http";
import type { AxiosResponse } from "axios";

type VoteStartResponse = {
  planId: number;
  toolType: "VOTE";
  status: string;
  finalRestaurantId: number;
  startedAt: string;
  closedAt: string;
  createdBy: number;
};

type VoteStartApiResponse = {
  status: string;
  code: string;
  message: string;
  data: VoteStartResponse;
};

export async function voteStart(planId: string): Promise<VoteStartResponse> {
  const response = await customAxios<AxiosResponse<VoteStartApiResponse>>({
    method: "POST",
    url: `/plans/${planId}/decision/vote/start`,
    meta: { authRequired: true },
  });

  if (
    response.data?.status !== "OK" &&
    response.data?.status !== "100 CONTINUE"
  ) {
    throw new Error(response.data?.message || "투표 시작에 실패했습니다.");
  }

  if (!response.data?.data) {
    throw new Error("투표 시작 응답 데이터가 없습니다.");
  }

  return response.data.data;
}
