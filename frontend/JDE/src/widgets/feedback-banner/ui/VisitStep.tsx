// src/widgets/feedback-banner/ui/VisitStep.tsx
// 목적: 방문 여부 확인 Step

import { Button } from "@/shared/ui/shadcn/button";

interface VisitStepProps {
  /** 방문 확인 콜백 */
  onVisited: () => void;
  /** 방문 안 함 콜백 */
  onNotVisited: () => void;
}

/**
 * 방문 여부 확인 Step - 버튼만 반환
 */
export default function VisitStep({ onVisited, onNotVisited }: VisitStepProps) {
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={onNotVisited}
      >
        아니요
      </Button>
      <Button
        variant="default"
        size="sm"
        className="flex-1"
        onClick={onVisited}
      >
        예
      </Button>
    </>
  );
}
