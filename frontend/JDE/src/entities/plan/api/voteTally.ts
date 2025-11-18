import customAxios from "@/shared/api/http";
import type { AxiosResponse } from "axios";

export type VoteResult = {
  restaurantId: number;
  votes: number;
  userIds: number[];
};

export type VoteTallyResponse = {
  planId: number;
  results: VoteResult[];
  totalVotes: number;
};

type VoteTallyApiResponse = {
  status: string;
  code: string;
  message: string;
  data: VoteTallyResponse;
};

export async function voteTally(planId: string): Promise<VoteTallyResponse> {
  const response = await customAxios<AxiosResponse<VoteTallyApiResponse>>({
    method: "GET",
    url: `/plans/${planId}/decision/vote/tally`,
    meta: { authRequired: true },
  });

  if (
    response.data?.status !== "OK" &&
    response.data?.status !== "100 CONTINUE"
  ) {
    throw new Error(response.data?.message || "투표 집계 조회에 실패했습니다.");
  }

  if (!response.data?.data) {
    throw new Error("투표 집계 응답 데이터가 없습니다.");
  }

  return response.data.data;
}
