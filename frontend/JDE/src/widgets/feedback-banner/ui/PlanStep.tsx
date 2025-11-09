// src/widgets/feedback-banner/ui/PlanStep.tsx
// 목적: 방문 계획 확인 Step

import { Button } from "@/shared/ui/shadcn/button";

interface PlanStepProps {
  /** 방문 계획 있음 콜백 */
  onWillVisit: () => void;
  /** 방문 계획 없음 콜백 */
  onWillNotVisit: () => void;
}

/**
 * 방문 계획 확인 Step - 버튼만 반환
 */
export default function PlanStep({ onWillVisit, onWillNotVisit }: PlanStepProps) {
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={onWillNotVisit}
      >
        안갈거에요
      </Button>
      <Button
        variant="default"
        size="sm"
        className="flex-1"
        onClick={onWillVisit}
      >
        나중에갈거에요
      </Button>
    </>
  );
}
