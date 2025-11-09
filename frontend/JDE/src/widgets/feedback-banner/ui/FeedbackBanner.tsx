// src/widgets/feedback-banner/ui/FeedbackBanner.tsx
// 목적: 피드백 배너 메인 컴포넌트 (상태 관리 + Step 전환)

import { useState, useEffect } from "react";
import BannerLayout from "./BannerLayout";
import VisitStep from "./VisitStep";
import RatingStep from "./RatingStep";
import PlanStep from "./PlanStep";
import { getMockPendingFeedback } from "@/entities/feedback/model/mockData";
import type { PendingFeedback, FeedbackStep, Rating } from "@/entities/feedback";

/**
 * 피드백 배너 메인 컴포넌트
 * - 피드백 대기 중인 식당이 있으면 배너 표시
 * - 단계별 질문 진행 (visit → rating/plan)
 */
export default function FeedbackBanner() {
  // 피드백 대기 중인 식당 데이터
  const [pendingFeedback, setPendingFeedback] = useState<PendingFeedback | null>(null);
  // 현재 단계
  const [currentStep, setCurrentStep] = useState<FeedbackStep>("visit");
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(true);

  // 피드백 데이터 로드
  useEffect(() => {
    const loadPendingFeedback = async () => {
      try {
        const data = await getMockPendingFeedback();
        setPendingFeedback(data);
      } catch (error) {
        console.error("Failed to load pending feedback:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPendingFeedback();
  }, []);

  /** 방문함 처리 */
  const handleVisited = () => {
    console.log("방문함 선택");
    setCurrentStep("rating");
  };

  /** 방문 안 함 처리 */
  const handleNotVisited = () => {
    console.log("방문 안 함 선택");
    setCurrentStep("plan");
  };

  /** 평가 제출 처리 */
  const handleRating = (rating: Rating) => {
    console.log("평가 제출:", rating);
    // TODO: API 연동
    // - 피드백 제출: PATCH /api/feedback/:id
    // - 성공 시 배너 제거
    setPendingFeedback(null);
    alert(`피드백 감사합니다! 평가: ${rating}`);
  };

  /** 방문 계획 있음 처리 */
  const handleWillVisit = () => {
    console.log("방문 계획 있음");
    // TODO: API 연동
    // - 하루 뒤 다시 표시하도록 설정
    setPendingFeedback(null);
    alert("다음에 다시 물어볼게요!");
  };

  /** 방문 계획 없음 처리 */
  const handleWillNotVisit = () => {
    console.log("방문 계획 없음");
    // TODO: API 연동
    // - 피드백 제거
    setPendingFeedback(null);
    alert("알겠습니다!");
  };

  // 로딩 중이거나 데이터가 없으면 렌더링 안 함
  if (isLoading || !pendingFeedback) {
    return null;
  }

  // 식당 이름
  const restaurantName = `📍 ${pendingFeedback.restaurant.name}`;

  // 현재 step에 따라 제목, 설명, 버튼 결정
  const getStepContent = () => {
    switch (currentStep) {
      case "visit":
        return {
          title: restaurantName,
          description: "전에 선택하신 식당이에요.\n방문하셨나요?",
          buttons: (
            <VisitStep
              onVisited={handleVisited}
              onNotVisited={handleNotVisited}
            />
          ),
        };
      case "rating":
        return {
          title: restaurantName,
          description: "방문하셨군요!\n어땠어요?",
          buttons: <RatingStep onRating={handleRating} />,
        };
      case "plan":
        return {
          title: restaurantName,
          description: "아직 방문 전이시군요.\n나중에 가실 계획이 있으신가요?",
          buttons: (
            <PlanStep
              onWillVisit={handleWillVisit}
              onWillNotVisit={handleWillNotVisit}
            />
          ),
        };
      default:
        return null;
    }
  };

  const stepContent = getStepContent();
  if (!stepContent) return null;

  return (
    <BannerLayout
      title={stepContent.title}
      description={stepContent.description}
    >
      {stepContent.buttons}
    </BannerLayout>
  );
}
