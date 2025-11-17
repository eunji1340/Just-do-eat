// src/features/groups/api/createGroup.ts

import http from "@/shared/api/http";

export type CreateGroupPayload = { roomName: string };

// 백엔드가 주는 키에 맞춰서 타입도 roomId로 맞춰줍니다.
export type CreateGroupResult = { roomId: number };

export async function createGroup(
  payload: CreateGroupPayload
): Promise<CreateGroupResult> {
  try {
    const res = await http.post("/rooms", payload);

    // 응답 래핑 구조: { status, code, message, data: { roomId } }
    const roomId =
      res.data?.data?.roomId ??
      res.data?.roomId; // 혹시 구조가 다르면 이쪽에서라도 잡히게

    if (!roomId && roomId !== 0) {
      throw new Error("생성된 모임 ID를 찾을 수 없습니다.");
    }

    return { roomId };
  } catch (error: any) {
    const msg =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      "그룹 생성 요청에 실패했습니다.";
    throw new Error(msg);
  }
}
