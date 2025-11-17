// src/features/groups/api/getMyGroup.ts
import http from "@/shared/api/http";
import type { GetMyRoomsResponse, Room } from "@/entities/groups/types";

export async function getMyGroups(): Promise<Room[]> {
  const res = await http.get<GetMyRoomsResponse>("/rooms",
    { headers: { Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyIiwiaWF0IjoxNzYzMzU4OTEzLCJleHAiOjE3NjMzNjI1MTN9.xlz-cyZ0ifYLF6sbw7IVeFxz1sMy8XWoRMauqk2axCk` }}
  ); // 실제 URL로 수정
  return res.data.data.roomList;
}
