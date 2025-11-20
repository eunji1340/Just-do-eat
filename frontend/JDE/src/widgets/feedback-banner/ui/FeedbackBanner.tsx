// src/widgets/feedback-banner/ui/FeedbackBanner.tsx
// 목적: 피드백 배너 메인 컴포넌트 (상태 관리 + Step 전환)

import { useState, useEffect } from "react";
import BannerLayout from "./BannerLayout";
import VisitStep from "./VisitStep";
import RatingStep from "./RatingStep";
import PlanStep from "./PlanStep";
import type {
  PendingFeedback,
  FeedbackStep,
  Rating,
} from "@/entities/feedback";
import { getLastSelectedRestaurant } from "@/entities/feedback/api/getLastSelectedRestaurant";
import { submitVisitFeedback } from "@/entities/feedback/api/submitVisitFeedback";
import { Pin, CheckCircle } from "lucide-react";

/**
 * 피드백 배너 메인 컴포넌트
 * - 피드백 대기 중인 식당이 있으면 배너 표시
 * - 단계별 질문 진행 (visit → rating/plan)
 * - TODO: 백엔드 API 연동 필요
 */
export default function FeedbackBanner() {
  // 피드백 대기 중인 식당 데이터
  const [pendingFeedback, setPendingFeedback] =
    useState<PendingFeedback | null>(null);
  // 현재 단계
  const [currentStep, setCurrentStep] = useState<FeedbackStep>("visit");
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(true);
  // 제출 중 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 피드백 완료 모달 표시 여부
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 피드백 데이터 로드
  useEffect(() => {
    const loadPendingFeedback = async () => {
      try {
        setIsLoading(true);
        const restaurantData = await getLastSelectedRestaurant();

        if (restaurantData) {
          // API 응답을 PendingFeedback 타입으로 변환
          const pendingFeedback: PendingFeedback = {
            id: `feedback-${restaurantData.restaurantId}`,
            restaurant: {
              restaurant_id: restaurantData.restaurantId,
              name: restaurantData.name,
              // 나머지 필드는 선택적으로 처리 (필요시 추가)
              address: "",
              phone: "",
              summary: "",
              image: [],
              category: "",
              rating: 0,
              price_range: "",
              website_url: "",
              menu: [],
              distance_m: 0,
              is_open: false,
              hours: null,
            },
            decidedAt: new Date().toISOString(),
            remainingCount: 1,
          };
          setPendingFeedback(pendingFeedback);
        } else {
          // 204 No Content인 경우
          setPendingFeedback(null);
        }
      } catch (error) {
        console.error("Failed to load pending feedback:", error);
        setPendingFeedback(null);
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
  const handleRating = async (rating: Rating) => {
    if (!pendingFeedback || isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Rating을 API의 satisfaction으로 매핑
      const satisfactionMap: Record<Rating, "LIKE" | "NEUTRAL" | "DISLIKE"> = {
        bad: "DISLIKE",
        good: "NEUTRAL",
        great: "LIKE",
      };

      await submitVisitFeedback(pendingFeedback.restaurant.restaurant_id, {
        isVisited: true,
        satisfaction: satisfactionMap[rating],
      });

      // 성공 시 모달 표시 후 배너 제거
      setShowSuccessModal(true);
    } catch (error) {
      console.error("피드백 제출 실패:", error);
      alert("피드백 제출에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /** 방문 계획 있음 처리 */
  const handleWillVisit = () => {
    // 나중에 갈 거예요 선택 시 API 호출 안 함
    setPendingFeedback(null);
  };

  /** 방문 계획 없음 처리 */
  const handleWillNotVisit = async () => {
    if (!pendingFeedback || isSubmitting) return;

    try {
      setIsSubmitting(true);

      // 안 갈 거예요 선택 시 isVisited: false로 API 호출
      await submitVisitFeedback(pendingFeedback.restaurant.restaurant_id, {
        isVisited: false,
      });

      // 성공 시 모달 표시 후 배너 제거
      setShowSuccessModal(true);
    } catch (error) {
      console.error("피드백 제출 실패:", error);
      alert("피드백 제출에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로딩 중이거나 데이터가 없으면 렌더링 안 함
  if (isLoading || !pendingFeedback) {
    return null;
  }

  // 식당 이름 (Pin 아이콘 포함)
  const restaurantName = (
    <span className="flex items-center gap-2">
      <Pin className="w-5 h-5 text-orange-500" />
      {pendingFeedback.restaurant.name}
    </span>
  );

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

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setPendingFeedback(null);
  };

  return (
    <>
      <BannerLayout
        title={stepContent.title}
        description={stepContent.description}
      >
        {stepContent.buttons}
      </BannerLayout>

      {/* 피드백 완료 모달 */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseSuccessModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-neutral-900 mb-2">
                피드백 반영 완료!
              </h2>
              <p className="text-sm text-neutral-600">
                소중한 의견 감사합니다
                <br />더 맞춤형 추천을 해드릴게요
              </p>
            </div>
            <button
              onClick={handleCloseSuccessModal}
              className="w-full py-3 px-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
