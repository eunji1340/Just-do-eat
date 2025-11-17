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

