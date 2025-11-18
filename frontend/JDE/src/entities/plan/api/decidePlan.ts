import customAxios from "@/shared/api/http";
import type { AxiosResponse } from "axios";

type DecidePlanApiResponse = {
  status: string;
  message: string;
  data: {
    planId: number;
    restaurantId: number;
  };
};

type DecidePlanResponse = {
  planId: number;
  restaurantId: number;
};

export async function decidePlan(
  planId: string,
  restaurantId: number
): Promise<DecidePlanResponse> {
  const response = await customAxios<AxiosResponse<DecidePlanApiResponse>>({
    method: "PATCH",
    url: `/plans/${planId}/decision`,
    data: {
      restaurantId,
    },
    meta: { authRequired: true },
  });

  if (response.data?.status !== "OK" || !response.data?.data) {
    throw new Error(
      response.data?.message || "식당 확정에 실패했습니다."
    );
  }

  return response.data.data;
}

