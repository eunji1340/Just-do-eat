// 목적: 그룹 생성 API POST 요청 (단일 책임: 네트워크 호출만)
// 사용: UI/폼에서는 이 함수만 호출하여 생성 수행

// src/features/groups/api/createGroup.ts

import http from "@/shared/api/http";

export type CreateGroupPayload = { roomName: string };
export type CreateGroupResult = { id: number };

// TODO: 로그인 완료시 인터셉터로 변경
export async function createGroup(
  payload: CreateGroupPayload
): Promise<CreateGroupResult> {
  try {
    const res = await http.post(
      "/rooms",
      payload,
      {
        headers: {
          Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyIiwiaWF0IjoxNzYzMzU4OTEzLCJleHAiOjE3NjMzNjI1MTN9.xlz-cyZ0ifYLF6sbw7IVeFxz1sMy8XWoRMauqk2axCk`, // 🔥 여기!!
        },
      }
    );

    return { id: res.data.id };
  } catch (error: any) {
    const msg =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      "그룹 생성 요청에 실패했습니다.";
    throw new Error(msg);
  }
}
