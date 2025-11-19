import type { AxiosResponse } from "axios";
import customAxios from "@/shared/api/http";

/**
 * DELETE /users API 응답 타입
 */
export type DeleteUserResponse = {
  status: string;
  code: string;
  message: string;
  data?: string;
};

/**
 * 현재 로그인한 사용자의 계정을 삭제합니다.
 * @returns 삭제 성공 메시지
 */
export async function deleteUser(): Promise<DeleteUserResponse["data"]> {
  const response = await customAxios<AxiosResponse<DeleteUserResponse>>({
    method: "DELETE",
    url: "/users",
    meta: { authRequired: true },
  });

  return response.data?.data;
}
