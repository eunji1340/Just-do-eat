// 목적: 스와이프 제스처 처리 훅
// 기능:
// 1) 드래그 위치(dx, dy) 계산
// 2) onMove()로 Deck에 오프셋 전달
// 3) 임계치(thresholdX, thresholdY) 넘으면 방향 판정해서 onSwipe(dir) 호출
// 4) reset(): 카드 교체 시 제스처 상태 완전히 초기화
//
// 🔥 추가 기능:
// - 비로그인 사용자는 "세로 스와이프(UP)만 가능"
//   → verticalOnly=true 일 때 좌/우 스와이프 금지
//
// 주의: UI 애니메이션은 Deck/FeedCard에 위임하고,
// 이 훅은 "제스처 판정"만 담당 → 단일 책임 구조 유지

import { useRef, useState } from "react";

export type SwipeDir = "left" | "right" | "up";
export type Offset = { x: number; y: number };

type Options = {
  onMove?: (offset: Offset) => void;  // 드래그 중 Deck에 오프셋 전달
  onSwipe: (dir: SwipeDir) => void;   // 방향 판정 후 콜백
  thresholdX?: number;                // 좌/우 스와이프 임계치
  thresholdY?: number;                // 위 스와이프 임계치

  // 🔥 비로그인 시 true → 좌/우 스와이프 차단하고 위로만 허용
  verticalOnly?: boolean;
};

export function useSwipeHandler({
  onMove,
  onSwipe,
  thresholdX = 64, // 기본 가로 스와이프 감도
  thresholdY = 80, // 기본 세로 스와이프 감도
  verticalOnly = false,
}: Options) {
  
  // 현재 드래그 offset(x, y)
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });

  // 드래그 중인지 여부
  const [isDragging, setIsDragging] = useState(false);

  // 드래그 시작점 저장
  const start = useRef({ x: 0, y: 0 });

  /* ---------------------------------------------------
   * reset(): 카드 교체 시 제스처 상태 완전 초기화
   * ---------------------------------------------------
   * Deck → FeedCard → useSwipeHandler.reset() 형태로 호출됨
   */
  function reset() {
    setOffset({ x: 0, y: 0 });
    setIsDragging(false);
    start.current = { x: 0, y: 0 };
    onMove?.({ x: 0, y: 0 });
  }

  /* ---------------------------------------------------
   * 드래그 시작 이벤트
   * --------------------------------------------------- */
  function handleStart(e: React.TouchEvent | React.MouseEvent) {
    const pt = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    start.current = { x: pt.clientX, y: pt.clientY };
    setIsDragging(true);
  }

  /* ---------------------------------------------------
   * 드래그 중 이벤트 → 현재 위치 offset 계산
   * --------------------------------------------------- */
  function handleMove(e: React.TouchEvent | React.MouseEvent) {
    if (!isDragging) return;

    const pt = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    const dx = pt.clientX - start.current.x;
    const dy = pt.clientY - start.current.y;

    const next = { x: dx, y: dy };
    setOffset(next);
    onMove?.(next);
  }

  /* ---------------------------------------------------
   * 드래그 종료 → 스와이프 방향 판정
   * --------------------------------------------------- */
  function handleEnd() {
    if (!isDragging) return;
    setIsDragging(false);

    const dx = offset.x;
    const dy = offset.y;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);

    /* ---------------------------------------------------
     * 🔥 비로그인 제한: 세로 스와이프(UP)만 허용
     * --------------------------------------------------- */
    if (verticalOnly) {
      if (dy < -thresholdY) {
        return onSwipe("up"); // 위로만 스와이프 가능
      }
      
      // 좌우 금지 → 원위치
      onMove?.({ x: 0, y: 0 });
      setOffset({ x: 0, y: 0 });
      return;
    }

    /* ---------------------------------------------------
     * 🔥 일반 로그인 사용자 → 좌/우/위 방향 모두 판정
     * --------------------------------------------------- */
    // 판정 기준: 가로 축 우선
    if (ax > ay) {
      if (dx > thresholdX) return onSwipe("right"); // →
      if (dx < -thresholdX) return onSwipe("left"); // ←
    } else {
      if (dy < -thresholdY) return onSwipe("up");   // ↑
    }

    // 스와이프 실패 → 카드 원위치
    onMove?.({ x: 0, y: 0 });
    setOffset({ x: 0, y: 0 });
  }

  return {
    offset,
    isDragging,
    handleStart,
    handleMove,
    handleEnd,
    reset,
  };
}
