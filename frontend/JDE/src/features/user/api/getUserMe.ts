import type { AxiosResponse } from "axios";
import customAxios from "@/shared/api/http";

/**
 * GET /users/me API 응답 타입
 */
export type UserMeResponse = {
  status: string;
  code: string;
  message: string;
  data?: {
    userId: number;
    name: string;
    imageUrl: string;
    role: string;
    ageGroup: string;
    gender: string;
    createdAt: string;
    updatedAt: string;
    regionId: number | null;
    regionName: string | null;
  };
};

/**
 * 현재 로그인한 사용자의 정보를 조회합니다.
 * @returns 사용자 정보
 */
export async function getUserMe(): Promise<UserMeResponse["data"]> {
  const response = await customAxios<AxiosResponse<UserMeResponse>>({
    method: "GET",
    url: "/users/me",
  });

  return response.data?.data;
}
