// src/widgets/feedback-banner/ui/RatingStep.tsx
// 목적: 평가 입력 Step

import { Button } from "@/shared/ui/shadcn/button";
import type { Rating } from "@/entities/feedback";

interface RatingStepProps {
  /** 평가 선택 콜백 */
  onRating: (rating: Rating) => void;
}

/**
 * 평가 입력 Step - 버튼만 반환
 */
export default function RatingStep({ onRating }: RatingStepProps) {
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={() => onRating("bad")}
      >
        별로에요
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={() => onRating("good")}
      >
        괜찮았어요
      </Button>
      <Button
        variant="default"
        size="sm"
        className="flex-1"
        onClick={() => onRating("great")}
      >
        최고에요
      </Button>
    </>
  );
}
