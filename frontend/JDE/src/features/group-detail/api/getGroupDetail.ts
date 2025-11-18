// src/features/group-detail/api/getRoomDetail.ts
import http from "@/shared/api/http";
import type { Room } from "@/entities/groups/types";

export type GetRoomDetailResponse = {
  status: string;
  code: string;
  message: string;
  data: Room;
};

export async function getGroupDetail(roomId: string): Promise<Room> {
  const res = await http.get<GetRoomDetailResponse>(`/rooms/${roomId}`, 
    { headers: { Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyIiwiaWF0IjoxNzYzMzU4OTEzLCJleHAiOjE3NjMzNjI1MTN9.xlz-cyZ0ifYLF6sbw7IVeFxz1sMy8XWoRMauqk2axCk` }
  });

  if (res.data.status !== "OK") {
    throw new Error(res.data.message || "방 상세 조회 실패");
  }

  return res.data.data;
}
