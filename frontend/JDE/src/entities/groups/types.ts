// src/entities/groups/types.ts

export type RoomMember = {
  roomMemberId: number;
  userId: number;
  userName: string;
  imageUrl: string;
  del: boolean;
};

export type Plan = {
  planId: number;
  startAt: string;              // ISO 문자열
  planManager: string;
  planName:string;
  restaurantName:string
  restaurantId:number;
  restaurantImageUrl: string;   // 썸네일로 쓸 수 있음
};

export type Room = {
  roomId: number;
  roomName: string;
  roomMemberList: RoomMember[];
  planList: Plan[];
};

export type GetMyRoomsResponse = {
  status: string;
  code: string;
  message: string;
  data: {
    roomList: Room[];
  };
};
