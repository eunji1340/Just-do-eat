import customAxios from "@/shared/api/http";
import type { AxiosResponse } from "axios";

type VoteSubmitApiResponse = {
  status: string;
  code: string;
  message: string;
  data: string;
};

export async function voteSubmit(
  planId: string,
  restaurantId: number
): Promise<string> {
  const response = await customAxios<AxiosResponse<VoteSubmitApiResponse>>({
    method: "POST",
    url: `/plans/${planId}/decision/vote/ballots`,
    data: {
      restaurantId,
    },
    meta: { authRequired: true },
  });

  if (response.data?.status !== "OK" && response.data?.status !== "100 CONTINUE") {
    throw new Error(response.data?.message || "투표 제출에 실패했습니다.");
  }

  return response.data?.data || "투표가 제출되었습니다.";
}

