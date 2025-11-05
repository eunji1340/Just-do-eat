// src/entities/feedback/model/mockData.ts
// 목적: 피드백 Mock 데이터 제공 (API 연동 전 테스트용)
// 교체 포인트: 실제 API 연동 시 이 파일 제거

import { DUMMY_RESTAURANTS } from "@/entities/restaurant/dummy";
import type { PendingFeedback } from "./types";

/**
 * 피드백 대기 중인 식당 Mock 데이터
 * - 실제 API: GET /api/feedback/pending
 */
export const MOCK_PENDING_FEEDBACK: PendingFeedback = {
  id: "feedback-001",
  restaurant: DUMMY_RESTAURANTS[0], // 봉추찜닭
  decidedAt: "2025-01-03T18:30:00Z",
  remainingCount: 3,
};

/**
 * Mock API: 피드백 대기 중인 식당 조회
 * @returns Promise<PendingFeedback | null>
 */
export const getMockPendingFeedback = async (): Promise<PendingFeedback | null> => {
  // 실제 API 호출 시뮬레이션 (500ms 지연)
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 50% 확률로 데이터 반환 (배너가 항상 보이지 않도록)
  // 테스트 시 true로 변경하면 항상 배너 표시
  const shouldShowBanner = true; // 개발 중에는 true로 설정

  return shouldShowBanner ? MOCK_PENDING_FEEDBACK : null;
};
