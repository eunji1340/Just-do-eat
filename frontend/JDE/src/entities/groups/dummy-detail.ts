// ================================
// File: src/entities/groups/dummy-detail.ts
// 목적: 화면 스케치용 더미 데이터 (API 연결 전 임시)
// ================================

import type { GroupDetail } from "./types";

export const dummyGroupDetail: GroupDetail = {
  groupId: 127,
  title: "을지로 회사 근처 점심 모임",
  description: "회사 주변 맛집 탐방 모임입니다.",
  members: [
    { id: 1, nickname: "민수", profileImg: "https://i.pravatar.cc/100?img=1" },
    { id: 2, nickname: "지혜", profileImg: "https://i.pravatar.cc/100?img=2" },
    { id: 3, nickname: "현우", profileImg: "https://i.pravatar.cc/100?img=3" },
    { id: 4, nickname: "소희", profileImg: "https://i.pravatar.cc/100?img=4" },
    { id: 5, nickname: "재훈", profileImg: "https://i.pravatar.cc/100?img=5" },
    { id: 6, nickname: "유진", profileImg: "https://i.pravatar.cc/100?img=6" },
    { id: 7, nickname: "성빈", profileImg: "https://i.pravatar.cc/100?img=7" },
    { id: 8, nickname: "하린", profileImg: "https://i.pravatar.cc/100?img=8" },
    { id: 9, nickname: "도윤", profileImg: "https://i.pravatar.cc/100?img=9" },
  ],
  pastAppointments: [
    {
      id: 901,
      category: "술집",
      restaurantName: "을지로 골뱅이",
      imageUrl: "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=800&auto=format&fit=crop",
      visitedAt: "2025-10-02",
      participants: ["민수", "지혜", "현우", "소희"],
    },
    {
      id: 902,
      category: "한식",
      restaurantName: "봉추찜닭",
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800&auto=format&fit=crop",
      visitedAt: "2025-10-21",
      participants: ["민수", "호진", "유진"],
    },
    {
      id: 905,
      category: "한식",
      restaurantName: "봉추찜닭",
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800&auto=format&fit=crop",
      visitedAt: "2025-09-21",
      participants: ["민수", "재훈", "유진"],
    },
    {
      id: 907,
      category: "한식",
      restaurantName: "봉추찜닭",
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800&auto=format&fit=crop",
      visitedAt: "2025-09-21",
      participants: ["민수", "재훈", "유진"],
    },
    {
      id: 910,
      category: "한식",
      restaurantName: "봉추찜닭",
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800&auto=format&fit=crop",
      visitedAt: "2025-09-21",
      participants: ["민수", "재훈", "유진"],
    },
    {
      id: 917,
      category: "한식",
      restaurantName: "봉추찜닭",
      imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800&auto=format&fit=crop",
      visitedAt: "2025-09-21",
      participants: ["민수", "재훈", "유진"],
    },
  ],
};