export type Member = {
  id: number
  nickname: string
  profileImg?: string
}

export type Group = {
  id: number
  title: string
  recentDate: string
  tags: string[]
  members?: Member[]
}

export type PastAppointment = {
  id: number;
  category: string;          // 예: 한식, 중식, 양식, 술집 등
  restaurantName: string;    // 예: "을지로 골뱅이"
  imageUrl: string;          // 썸네일 URL
  visitedAt: string;         // YYYY-MM-DD (간단 표기)
  participants: string[];    // 닉네임 배열
};

export type GroupDetail = {
  groupId: number;
  title: string;
  description?: string;
  members: Member[];
  pastAppointments: PastAppointment[];
};