// src/features/plans/api/createPlan.ts
// 목적: 약속(플랜) 생성 API 호출 (단일 책임: HTTP 통신 + 타입 정의)
// 엔드포인트: POST /plans/{roomId}

import http from "@/shared/api/http";

// 🔹 백엔드와 약속할 요청 바디 타입 (path 변수 roomId 제외)
export type PriceRangeCode = "LOW" | "MEDIUM" | "HIGH" | "PREMIUM";

export type CreatePlanRequestBody = {
  participantIds: number[];      // 참여자 userId 목록
  planName: string;              // 약속 이름
  centerLat: number;             // 지도 중심 위도
  centerLon: number;             // 지도 중심 경도
  radiusM: number;               // 탐색 반경 (미터)
  startsAt: string;              // "YYYY-MM-DDTHH:MM:SS"
  dislikeCategories: string[];   // 싫어하는 카테고리 목록
  priceRanges: PriceRangeCode[]; // 가격대 목록
};

// 🔹 프론트에서 쓰기 편하게 roomId(path 변수)까지 포함한 Payload 타입
export type CreatePlanPayload = CreatePlanRequestBody & {
  roomId: number;                // URL 경로에 들어갈 roomId
};

// 🔹 응답 타입 (백엔드 스펙에 맞게 필요하면 확장)
export type CreatePlanResponse = {
  id: number;                    // 생성된 약속 ID (planId 등과 매핑)
  // TODO: res.data에 다른 필드가 있으면 여기에 추가
};

// 🔹 실제 API 호출 함수
export async function createPlan(
  payload: CreatePlanPayload
): Promise<CreatePlanResponse> {
  const { roomId, ...body } = payload;
  // POST /plans/{roomId}
  const res = await http.post(`/plans/${roomId}`, body);
  console.log(res)

  // 백엔드가 planId로 내려줄 수도 있으니 안전하게 매핑
  const id = res.data.id ?? res.data.planId;

  return { id };
}
