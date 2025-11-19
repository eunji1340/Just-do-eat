// 목적: 스와이프 제스처 해석 (낮은 임계치 + 속도 기반 판정)
// - 거리 임계: X 64px / Y 80px (기존보다 훨씬 낮춤)
// - 속도 임계: 0.35 px/ms 이상이면 거리 조금만 가도 스와이프 인정
// - 진행 중 오프셋을 부모로 계속 전달(onMove)

import { useRef, useState } from "react";

export type SwipeDir = "left" | "right" | "up";
export type Offset = { x: number; y: number };

type Options = {
  onMove?: (offset: Offset) => void;
  onSwipe: (dir: SwipeDir) => void;
  thresholdX?: number; // 기본 64
  thresholdY?: number; // 기본 80
  velocityThreshold?: number; // px/ms, 기본 0.35
};

export function useSwipeHandler({
  onMove,
  onSwipe,
  thresholdX = 64,
  thresholdY = 80,
}: Options) {
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const start = useRef({ x: 0, y: 0 });

  function handleStart(e: React.TouchEvent | React.MouseEvent) {
    const pt = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    setIsDragging(true);
    start.current = { x: pt.clientX, y: pt.clientY };
  }

  function handleMove(e: React.TouchEvent | React.MouseEvent) {
    if (!isDragging) return;
    const pt = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    const dx = pt.clientX - start.current.x;
    const dy = pt.clientY - start.current.y;
    const next = { x: dx, y: dy };
    setOffset(next);
    onMove?.(next);
  }

  function handleEnd() {
    if (!isDragging) return;
    setIsDragging(false);

    const dx = offset.x;
    const dy = offset.y;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);

    // 주축 우선: 가로가 더 크면 좌/우, 세로가 더 크면 위만
    if (ax > ay) {
      if (dx > thresholdX) return fire("right");
      if (dx < -thresholdX) return fire("left");
    } else {
      if (dy < -thresholdY) return fire("up");
    }

    // ❌ 임계 미달 → 실패 스와이프 → 원위치 + 부모에 알림
    reset(); // emit === true (기본값)
  }

  function fire(dir: SwipeDir) {
    onSwipe(dir); // → RestaurantSwipeDeck.handleSwiped(dir)
    reset(false); // ✅ offset만 0으로, onMove는 호출 안 함
  }

  function reset(emit: boolean = true) {
    setOffset({ x: 0, y: 0 });
    if (emit) {
      onMove?.({ x: 0, y: 0 });
    }
  }

  return { offset, isDragging, handleStart, handleMove, handleEnd };
}
