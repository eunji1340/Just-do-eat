// src/entities/feedback/model/types.ts
// 목적: 피드백 관련 타입 정의

import type { Restaurant } from "@/entities/restaurant";

/**
 * 피드백 단계 타입
 * - visit: 방문 확인 단계
 * - rating: 평가 단계
 * - plan: 방문 계획 확인 단계
 */
export type FeedbackStep = "visit" | "rating" | "plan";

/**
 * 평가 타입
 * - bad: 별로
 * - good: 괜찮
 * - great: 정말 좋았
 */
export type Rating = "bad" | "good" | "great";

/**
 * 피드백 대기 중인 식당 정보
 */
export interface PendingFeedback {
  /** 피드백 ID */
  id: string;
  /** 식당 정보 */
  restaurant: Restaurant;
  /** 결정한 날짜 */
  decidedAt: string;
  /** 남은 피드백 개수 */
  remainingCount: number;
}

/**
 * 피드백 제출 데이터
 */
export interface FeedbackSubmission {
  /** 피드백 ID */
  feedbackId: string;
  /** 식당 ID */
  restaurantId: number;
  /** 방문 여부 */
  visited: boolean;
  /** 평가 (방문한 경우) */
  rating?: Rating;
  /** 방문 계획 여부 (방문 안 한 경우) */
  willVisit?: boolean;
}
