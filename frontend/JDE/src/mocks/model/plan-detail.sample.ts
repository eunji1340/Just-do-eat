import type { PlanDetail } from "@/entities/plan/model/types";

const basePlanDetail: PlanDetail = {
  planId: "plan-123",
  groupName: "맛집 탐험대",
  planName: "10월 마지막 모임",
  dateISO: "2025-10-31T19:00:00+09:00",
  ownerId: "u-1",
  members: [
    { id: "u-1", name: "지현", profileImageUrl: "https://i.pravatar.cc/96?img=1" },
    { id: "u-2", name: "민수", profileImageUrl: "https://i.pravatar.cc/96?img=12" },
    { id: "u-3", name: "소희", profileImageUrl: "https://i.pravatar.cc/96?img=35" },
    { id: "u-4", name: "연우", profileImageUrl: "https://i.pravatar.cc/96?img=55" },
    { id: "u-5", name: "유진", profileImageUrl: "https://i.pravatar.cc/96?img=64" },
    { id: "u-6", name: "하린", profileImageUrl: "https://i.pravatar.cc/96?img=77" },
  ],
  status: "decided",
  decisionTool: "vote",
  deciderId: "u-1",
  meetingPlace: "홍대입구역 9번 출구 광장",
  decidedRestaurant: {
    id: "r-1",
    name: "미식당 홍대본점",
    category: "한식",
    imageUrl:
      "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=200&q=80",
    signatureMenus: ["특선 불고기", "바지락 칼국수"],
    likesCount: 356,
  },
  recommended: [
    {
      id: "r-1",
      name: "미식당 홍대본점",
      category: "한식",
      imageUrl:
        "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=200&q=80",
      signatureMenus: ["특선 불고기", "바지락 칼국수"],
      likesCount: 356,
    },
    {
      id: "r-2",
      name: "파스타 포레스트",
      category: "이탈리안",
      imageUrl:
        "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=200&q=80",
      signatureMenus: ["트러플 크림 파스타", "버섯 리조또"],
      likesCount: 278,
    },
    {
      id: "r-3",
      name: "스시 하루",
      category: "일식",
      imageUrl:
        "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=200&q=80",
      signatureMenus: ["특선 모둠 스시", "연어 사시미"],
      likesCount: 192,
    },
  ],
  participantsCount: 6,
  conditions: {
    budgetPerPerson: 20000,
    preferSpicy: false,
    parking: true,
  },
};

const planDetailSamples: Record<string, PlanDetail> = {
  "plan-123": basePlanDetail,
  "plan-456": {
    ...basePlanDetail,
    planId: "plan-456",
    planName: "11월 첫째주 점심",
    dateISO: "2025-11-05T12:00:00+09:00",
    decisionTool: "roulette",
    status: "deciding",
    decidedRestaurant: null,
    recommended: basePlanDetail.recommended.map((item, index) => ({
      ...item,
      id: `plan-456-r-${index + 1}`,
      likesCount: item.likesCount - 40,
    })),
  },
};

function clonePlanDetail(source: PlanDetail): PlanDetail {
  if (typeof structuredClone === "function") {
    return structuredClone(source);
  }
  return JSON.parse(JSON.stringify(source)) as PlanDetail;
}

export function resolvePlanDetailSample(planId: string): PlanDetail {
  const source = planDetailSamples[planId] ?? planDetailSamples["plan-123"];
  return clonePlanDetail(source);
}

