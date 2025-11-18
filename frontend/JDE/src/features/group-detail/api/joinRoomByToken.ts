// src/features/groups/api/joinRoomByToken.ts
import http from "@/shared/api/http";

export type JoinRoomResponse = {
  roomId: number;
  joinStatus: "JOIN" | "ALREADY" | string;
};

export async function joinRoomByToken(token: string): Promise<JoinRoomResponse> {
  const res = await http.post(
    `/rooms/join?token=${encodeURIComponent(token)}`
  );

  const { roomId, joinStatus } = res.data.data;
  return { roomId, joinStatus };
}
