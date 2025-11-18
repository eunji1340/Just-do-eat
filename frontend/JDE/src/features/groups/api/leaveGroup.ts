// src/features/groups/api/leaveRoom.ts
// 목적: 특정 room(모임)에서 "나가기" 요청을 서버에 보내는 API 함수
// 단일 책임: DELETE /rooms/{roomId} 호출만 담당

import http from "@/shared/api/http";

/**
 * 모임 나가기 API
 * - DELETE /rooms/{roomId}
 * - 성공 시 보통 204 No Content 또는 200 OK 를 기대
 */
export async function leaveGroup(roomId: number): Promise<void> {
  try {
    await http.delete(`/rooms/${roomId}`, { headers: { Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyIiwiaWF0IjoxNzYzMzUxNjE1LCJleHAiOjE3NjMzNTUyMTV9.7fUXhzIDT55v1LXENbviVCvQLxSHP-vpAujQP61oyjw` }}
);
    // 응답 데이터가 필요 없다고 가정해서 void 반환
  } catch (error: any) {
    const msg =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      "모임 나가기에 실패했습니다.";
    throw new Error(msg);
  }
}
