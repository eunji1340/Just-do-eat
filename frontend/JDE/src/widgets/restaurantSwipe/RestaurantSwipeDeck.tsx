// 목적: 스와이프 덱 컨테이너 (FeedPage → 이 컴포넌트 사용)
//
// 주요 기능:
// 1) 카드 스와이프(좌/우/상) 제스처 처리
// 2) 카드 애니메이션 (날아가기 / 다음 카드 등장)
// 3) 비로그인 사용자는 방향 제한 (위로 스와이프만 허용)
// 4) 버튼도 로그인 여부에 따라 자동 비활성화
// 5) 북마크 / 상세페이지 기능 포함
// 6) 다음 카드 등장 시 초기 오프셋/제스처 상태 reset()
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
import http from "@/shared/api/http";

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

  /* ------------------------------------------
   * 상태 정의
   * ---------------------------------------- */
  const [index, setIndex] = React.useState(0);
  const [offset, setOffset] = React.useState<Offset>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [transitionEnabled, setTransitionEnabled] = React.useState(true);
  const [finalDir, setFinalDir] = React.useState<
    "left" | "right" | "up" | null
  >(null);
  const [emptyNotified, setEmptyNotified] = React.useState(false);

  // FeedCard가 내부 제스처를 초기화하도록 reset() 전달받음
  const swipeResetRef = React.useRef<(() => void) | null>(null);
  const registerReset = (fn: () => void) => (swipeResetRef.current = fn);

  // 현재 카드
  const top = items[index];

  // 로그인 여부 → 좌우 스와이프·버튼 제한
  const isLoggedIn = !!localStorage.getItem("accessToken");
  const verticalOnly = !isLoggedIn;

  /* ------------------------------------------
   * 스와이프 드래그 중 offset 업데이트
   * ---------------------------------------- */
  function handleMove(o: Offset) {
    setOffset(o);
    setIsDragging(true);
    setFinalDir(null);
  }

  /* ------------------------------------------
   * 스와이프 확정 방향 처리
   * ---------------------------------------- */
  function handleSwiped(dir: "left" | "right" | "up") {
    const cur = items[index];
    if (!cur) return;

    // ❌ 비로그인 → 좌우 스와이프 차단
    if (verticalOnly && (dir === "left" || dir === "right")) {
      setOffset({ x: 0, y: 0 });
      return;
    }

    setIsDragging(false);
    setFinalDir(dir);

    // FE 상위 로직 호출
    onTopSwiped?.(dir, cur);

    // 오른쪽 → 선택 → 메인 이동
    if (dir === "right") {
      setTimeout(() => router("/"), 550);
      return;
    }

    // 왼쪽/위 → 다음 카드로 이동
    setTimeout(showNextCard, overlayHoldMs);
  }

  /* ------------------------------------------
   * 다음 카드 등장 애니메이션
   * ---------------------------------------- */
  function showNextCard() {
    setIndex((v) => v + 1);

    swipeResetRef.current?.(); // FeedCard 내부 제스처 초기화

    // 새 카드: 아래에서 등장(y:200 → 0)
    setTransitionEnabled(false);
    setOffset({ x: 0, y: 200 });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitionEnabled(true);
        setOffset({ x: 0, y: 0 });
      });
    });

    setFinalDir(null);
  }

  /* ------------------------------------------
   * 버튼 클릭 → 애니메이션 후 스와이프 처리
   * ---------------------------------------- */
  function animateSwipe(dir: "left" | "right" | "up") {
    if (verticalOnly && (dir === "left" || dir === "right")) return;

    const dist = 900;
    setTransitionEnabled(true);

    if (dir === "right") setOffset({ x: dist, y: 0 });
    if (dir === "left") setOffset({ x: -dist, y: 0 });
    if (dir === "up") setOffset({ x: 0, y: -dist });

    setTimeout(() => handleSwiped(dir), 800);
  }

  /* ------------------------------------------
   * 북마크 핸들러
   * ---------------------------------------- */
  async function handleBookmark() {
    if (!top) return;
    if (!isLoggedIn) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    try {
      await http.post(`/restaurants/${top.restaurant_id}/bookmark`);
      alert("북마크에 추가되었습니다!");
    } catch {
      alert("북마크 추가에 실패했습니다.");
    }
  }

  /* ------------------------------------------
   * 상세 페이지 이동
   * ---------------------------------------- */
  function handleInfo() {
    if (!top) return;

    router(`/restaurants/${top.restaurant_id}`, {
      state: { fromFeed: true },
    });
  }

  /* ------------------------------------------
   * 카드 소진 감지
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
        <SwipeOverlay offset={offset} finalDir={finalDir} visible={true} />

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

      {/* 하단 버튼 영역 */}
      {top && (
        <div className="pointer-events-none absolute bottom-6 left-0 right-0 flex items-center justify-center">
          <div className="pointer-events-auto flex items-center gap-4">

            {/* 좌_swipe */}
            <CircularButton
              type="dislike"
              disabled={verticalOnly}
              icon={<X />}
              onClick={() => animateSwipe("left")}
            />

            {/* 북마크 */}
            <CircularButton
              type="bookmark"
              disabled={verticalOnly}
              icon={<Star />}
              onClick={handleBookmark}
            />

            {/* 보류(up) */}
            <CircularButton
              type="next"
              icon={<ArrowDown />}
              onClick={() => animateSwipe("up")}
            />

            {/* 상세정보 */}
            <CircularButton
              type="info"
              icon={<CircleAlert />}
              onClick={handleInfo}
            />

            {/* 우_swipe */}
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
