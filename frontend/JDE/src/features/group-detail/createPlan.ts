// src/features/plans/api/createPlan.ts
// 목적: 약속(플랜) 생성 API 호출 (단일 책임: HTTP 통신 + 타입 정의)
// 예: axios 인스턴스, fetch wrapper 등

// 🔹 백엔드와 약속할 요청 바디 타입
export type CreatePlanPayload = {
  title: string;             // 약속 이름
  place: string;             // 장소
  priceRange: "LOW" | "MEDIUM" | "HIGH" | "PREMIUM"; // 가격대 (예시)
  date: string;              // "YYYY-MM-DD"
  time: string;              // "HH:MM"
  participants: string[];    // 참여자 이름 목록 (임시)
  groupId?: number;          // 특정 모임에 속한 약속이면 사용
};

// 🔹 응답 타입 (필요한 만큼만 정의)
export type CreatePlanResponse = {
  id: number;                // 생성된 약속 ID
  // TODO: 백엔드 스펙에 맞게 필드 추가
};

// 🔹 실제 API 호출 함수
export async function createPlan(
  payload: CreatePlanPayload,
): Promise<CreatePlanResponse> {
  // TODO: 실제 API URL은 백엔드 스펙에 맞게 바꿔 주세요.
  // 예시1) 모임 하위 리소스로 약속 생성
  // POST /groups/:groupId/plans/

  const res = await fetch("/group", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    // 필요 시 credentials: 'include' 등 추가
  });
  return res.json();
}
