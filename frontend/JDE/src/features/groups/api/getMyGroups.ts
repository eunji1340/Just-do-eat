// src/features/groups/api/getMyGroup.ts
import http from "@/shared/api/http";
import type { GetMyRoomsResponse, Room } from "@/entities/groups/types";

export async function getMyGroups(): Promise<Room[]> {
  const res = await http.get<GetMyRoomsResponse>("/rooms",
    { headers: { Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyIiwiaWF0IjoxNzYzMzM4NDE5LCJleHAiOjE3NjMzNDIwMTl9.E2xfnYewhSOTgwnOUsnesnq7_N1-Z3KGjGgD8elx5A4` }}
  ); // 실제 URL로 수정
  return res.data.data.roomList;
}
