// 목적: 스와이프 덱 컨테이너 (FeedPage → 이 컴포넌트 사용)
//
// 주요 기능:
// 1) 카드 스와이프(좌/우/상) 제스처 처리
// 2) 카드 애니메이션 (날아가기 / 다음 카드 등장)
// 3) 비로그인 사용자는 방향 제한 (위로 스와이프만 허용)
// 4) 버튼도 로그인 여부에 따라 자동 비활성화
// 5) 다음 카드 등장 시 초기 오프셋/제스처 상태 reset()
//
// ※ 핵심: "로그인 여부 판단 → 좌우 스와이프 제한"을
//    이 파일(Deck) 하나에서만 처리하도록 설계함.

import * as React from "react";
import FeedCard from "@/features/feed/FeedCard";
import SwipeOverlay from "./SwipeOverlay";
import type { Restaurant } from "@/entities/restaurant/types";
import type { Offset } from "@/features/feed/useSwipeHandler";
import { X, Check, ArrowDown, CircleAlert, Star } from "lucide-react";
import { CircularButton } from "@/shared/ui/button/circular-button";
import { useNavigate } from "react-router-dom";

type Props = {
  items: Restaurant[];
  onTopSwiped?: (dir: "left" | "right" | "up", item: Restaurant) => void;
  overlayHoldMs?: number;
  onDeckEmpty?: () => void;
  hasMore?: boolean;
};

export default function RestaurantSwipeDeck({
  items,
  onTopSwiped,
  overlayHoldMs = 700,
  onDeckEmpty,
  hasMore = true,
}: Props) {
  const router = useNavigate();

  // 현재 카드 index
  const [index, setIndex] = React.useState(0);

  // 카드 위치 오프셋
  const [offset, setOffset] = React.useState<Offset>({ x: 0, y: 0 });

  // 드래그 중 여부
  const [isDragging, setIsDragging] = React.useState(false);

  // transform 애니메이션 적용 여부
  const [transitionEnabled, setTransitionEnabled] = React.useState(true);

  // 마지막 스와이프 방향
  const [finalDir, setFinalDir] = React.useState<
    "left" | "right" | "up" | null
  >(null);

  // 카드 소진 체크
  const [emptyNotified, setEmptyNotified] = React.useState(false);

  // FeedCard가 내부 제스처를 초기화하도록 reset() 전달받음
  const swipeResetRef = React.useRef<(() => void) | null>(null);
  const registerReset = (fn: () => void) => {
    swipeResetRef.current = fn;
  };

  // 현재 카드
  const top = items[index];

  // 🔐 로그인 여부 체크 → 좌/우 스와이프 차단
  const isLoggedIn = !!localStorage.getItem("accessToken");
  const verticalOnly = !isLoggedIn; // true면 위 스와이프만 허용

  /* ------------------------------------------
   * 스와이프 드래그 중 offset 업데이트
   * ---------------------------------------- */
  function handleMove(o: Offset) {
    setOffset(o);
    setIsDragging(true);
    setFinalDir(null); // 드래그 중에는 확정 방향 숨김
  }

  /* ------------------------------------------
   * 스와이프 확정 방향
   * ---------------------------------------- */
  function handleSwiped(dir: "left" | "right" | "up") {
    const cur = items[index];
    if (!cur) return;

    // 🔐 비로그인 사용자는 좌/우 스와이프 금지
    if (verticalOnly && (dir === "left" || dir === "right")) {
      // 카드 원위치 복귀
      setOffset({ x: 0, y: 0 });
      return;
    }

    // 실제 확정 방향 반영
    setIsDragging(false);
    setFinalDir(dir);

    // 외부 콜백 실행
    onTopSwiped?.(dir, cur);

    // RIGHT → SELECT(선택) → 메인 이동
    if (dir === "right") {
      setTimeout(() => router("/"), 550);
      return;
    }

    // LEFT / UP → 다음 카드로 이동
    setTimeout(showNextCard, overlayHoldMs);
  }

  /* ------------------------------------------
   * 다음 카드 등장 처리
   * ---------------------------------------- */
  function showNextCard() {
    setIndex((v) => v + 1);

    // FeedCard 내부 제스처 초기화
    swipeResetRef.current?.();

    // 새 카드 등장 방향: 아래 → 위 (y: 200 → 0)
    setTransitionEnabled(false);
    setOffset({ x: 0, y: 200 });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitionEnabled(true);
        setOffset({ x: 0, y: 0 });
      });
    });

    setFinalDir(null);
    setIsDragging(false);
  }

  /* ------------------------------------------
   * 버튼 클릭 애니메이션
   * ---------------------------------------- */
  function animateSwipe(dir: "left" | "right" | "up") {
    // 비로그인 제한
    if (verticalOnly && (dir === "left" || dir === "right")) return;

    const dist = 900; // 천천히 날아가도록 거리 증가
    setTransitionEnabled(true);

    if (dir === "right") setOffset({ x: dist, y: 0 });
    if (dir === "left") setOffset({ x: -dist, y: 0 });
    if (dir === "up") setOffset({ x: 0, y: -dist });

    // 날아가는 시간: 0.8s로 느리게
    setTimeout(() => handleSwiped(dir), 800);
  }

  /* ------------------------------------------
   * 카드 소진 감지 → fetchMore 요청
   * ---------------------------------------- */
  React.useEffect(() => {
    if (!onDeckEmpty) return;

    const noMore = index >= items.length && items.length > 0;

    if (noMore && !emptyNotified) {
      setEmptyNotified(true);
      onDeckEmpty();
    }

    if (!noMore && emptyNotified) {
      setEmptyNotified(false);
    }
  }, [index, items.length]);

  /* ------------------------------------------
   * UI 렌더링
   * ---------------------------------------- */
  return (
    <div className="relative h-dvh flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden">
        {/* 오버레이 색상 띠 */}
        <SwipeOverlay offset={offset} finalDir={finalDir} visible={true} />

        {/* 카드 */}
        {top ? (
          <FeedCard
            data={top}
            offset={offset}
            isDragging={isDragging}
            onMove={handleMove}
            onSwiped={handleSwiped}
            transitionEnabled={transitionEnabled}
            resetHandler={registerReset}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            {hasMore ? "추천을 불러오는 중..." : "더 이상 카드가 없어요"}
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      {top && (
        <div className="pointer-events-none absolute bottom-6 left-0 right-0 flex items-center justify-center">
          <div className="pointer-events-auto flex items-center gap-4">

            {/* 좌우 스와이프 금지 시 disabled 처리 */}
            <CircularButton
              type="dislike"
              disabled={verticalOnly}
              icon={<X />}
              onClick={() => animateSwipe("left")}
            />

            <CircularButton
              type="bookmark"
              disabled={verticalOnly}
              icon={<Star />}
              onClick={() => animateSwipe("left")}
            />

            <CircularButton
              type="next"
              icon={<ArrowDown />}
              onClick={() => animateSwipe("up")}
            />

            <CircularButton
              type="info"
              icon={<CircleAlert />}
              onClick={() => animateSwipe("up")}
            />

            <CircularButton
              type="confirm"
              disabled={verticalOnly}
              icon={<Check />}
              onClick={() => animateSwipe("right")}
            />
          </div>
        </div>
      )}
    </div>
  );
}
