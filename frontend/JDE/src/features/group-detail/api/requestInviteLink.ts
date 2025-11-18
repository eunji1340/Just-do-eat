// src/features/group-detail/api/requestInviteLink.ts
import http from "@/shared/api/http";

export type InviteLinkResult = {
  inviteLink: string;
};

export async function requestInviteLink(roomId: string): Promise<InviteLinkResult> {
  const res = await http.post(`/rooms/${roomId}/invite`);
  // 백엔드 응답 구조:
  // { status, code, message, data: { inviteLink: "..." } }
  return {
    inviteLink: res.data.data.inviteLink,
  };
}
