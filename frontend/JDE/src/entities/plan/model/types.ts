export type Member = {
  id: string;
  name: string;
  profileImageUrl: string;
};

export type Restaurant = {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  signatureMenus: string[];
  likesCount: number;
};

export type PlanDetail = {
  planId: string;
  groupName: string;
  planName: string;
  dateISO: string;
  ownerId: string;
  members: Member[];
  status: "deciding" | "decided" | "canceled";
  decisionTool: "vote" | "roulette" | null;
  deciderId?: string | null;
  meetingPlace?: string | null;
  decidedRestaurant?: Restaurant | null;
  recommended: Restaurant[];
  participantsCount: number;
  conditions: Record<string, string | number | boolean>;
};

// 새로운 API 스펙에 맞는 타입
export type PlanParticipant = {
  userId: number;
  userName: string;
  userUrl: string | null;
};

export type PlanDetailResponse = {
  roomId: number;
  roomName: string;
  planId: number;
  planPlace: string | null;
  startAt: string;
  planManager: string;
  status: "OPEN" | "VOTING" | "DECIDED";
  decisionTool: "vote" | "roulette" | "tournament" | null;
  priceRange: ("LOW" | "MEDIUM" | "HIGH")[];
  dislikeCategoryList: string[];
  planParticipantList: PlanParticipant[];
};

export type MenuItem = {
  name: string;
  price: number;
  is_recommend: boolean;
  is_ai_mate: boolean;
};

export type CandidateRestaurant = {
  restaurant: {
    restaurant_id: number;
    kakao_id: number;
    name: string;
    address: string;
    category1: string;
    category2: string;
    category3: string;
    kakao_rating: number;
    kakao_review_cnt: number;
    price_range: "LOW" | "MEDIUM" | "HIGH";
    image: string;
    bookmarked: boolean | null;
    saved_count?: number; // 즐겨찾기 수
  };
  distanceM: number;
  menu: MenuItem[];
};

export type PlanCandidatesResponse = {
  next_cursor: string | null;
  items: CandidateRestaurant[];
};

