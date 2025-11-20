// 목적: 스와이프 덱 컨테이너 (FeedPage → 이 컴포넌트 사용)
//
// 주요 기능:
// 1) 카드 스와이프(좌/우/상) 제스처 처리
// 2) 카드 애니메이션 (날아가기 / 다음 카드 등장)
// 3) 비로그인 사용자는 좌/우 스와이프 제한 (위로만 가능)
// 4) 북마크 / 상세페이지 이동 기능 제공
// 5) 각 카드 전환 시 offset / isDragging / transition 상태 초기화
//
// ※ FeedCard 최신 API 기준: offset / isDragging / transitionEnabled / resetHandler 모두 Deck에서 전달해야 함

import * as React from "react";
import { useNavigate } from "react-router-dom";
import FeedCard from "@/features/feed/FeedCard";
import SwipeOverlay from "./SwipeOverlay";
import type { Restaurant } from "@/entities/restaurant/types";
import type { Offset } from "@/features/feed/useSwipeHandler";
import { X, Check, ArrowDown, CircleAlert, Star } from "lucide-react";
import { CircularButton } from "@/shared/ui/button/circular-button";
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
  const navigate = useNavigate();

  /* -------------------------------
   * 상태 관리
   * ----------------------------- */
  const [index, setIndex] = React.useState(0);
  const [offset, setOffset] = React.useState<Offset>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [transitionEnabled, setTransitionEnabled] = React.useState(true);

  const [finalDir, setFinalDir] = React.useState<
    "left" | "right" | "up" | null
  >(null);
  const [emptyNotified, setEmptyNotified] = React.useState(false);

  // FeedCard가 제공하는 reset() 연결
  const resetRef = React.useRef<(() => void) | null>(null);
  const registerReset = (fn: () => void) => (resetRef.current = fn);

  const top = items[index];

  // 로그인 여부 → 좌우 스와이프 제한
  const isLoggedIn = !!localStorage.getItem("accessToken");
  const verticalOnly = !isLoggedIn;

  /* -------------------------------
   * 드래그 중 offset 업데이트
   * ----------------------------- */
  function handleMove(o: Offset) {
    setOffset(o);
    setIsDragging(true);
    setFinalDir(null);
  }

  /* -------------------------------
   * 스와이프 확정 처리
   * ----------------------------- */
  function handleSwiped(dir: "left" | "right" | "up") {
    const cur = items[index];
    if (!cur) return;

    // 비로그인 → 좌우 금지
    if (verticalOnly && (dir === "left" || dir === "right")) {
      setOffset({ x: 0, y: 0 });
      setIsDragging(false);
      return;
    }

    setFinalDir(dir);
    setIsDragging(false);
    onTopSwiped?.(dir, cur);

    if (dir === "right") {
      // 오른쪽 → 선택 → 홈 이동
      setTimeout(() => navigate("/"), 550);
      return;
    }

    // 왼쪽 / 위 → 다음 카드
    setTimeout(showNextCard, overlayHoldMs);
  }

  /* -------------------------------
   * 다음 카드 등장 애니메이션
   * ----------------------------- */
  function showNextCard() {
    setIndex((i) => i + 1);

    // 내부 제스처 상태 초기화
    resetRef.current?.();

    // 새 카드: 아래(y:200)에서 0으로 등장
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

  /* -------------------------------
   * 버튼 클릭 → 애니메이션 후 스와이프 처리
   * ----------------------------- */
  function animateSwipe(dir: "left" | "right" | "up") {
    if (verticalOnly && (dir === "left" || dir === "right")) return;

    const dist = 900;

    setTransitionEnabled(true);
    if (dir === "right") setOffset({ x: dist, y: 0 });
    if (dir === "left") setOffset({ x: -dist, y: 0 });
    if (dir === "up") setOffset({ x: 0, y: -dist });

    setTimeout(() => handleSwiped(dir), 800);
  }

  /* -------------------------------
   * 북마크 기능
   * ----------------------------- */
  async function handleBookmark() {
    if (!top) return;
    if (!isLoggedIn) return alert("로그인이 필요한 기능입니다.");

    try {
      await http.post(`/restaurants/${top.restaurant_id}/bookmark`);
      alert("북마크에 추가되었습니다!");
    } catch {
      alert("북마크 추가 실패");
    }
  }

  /* -------------------------------
   * 상세페이지 이동
   * ----------------------------- */
  function handleInfo() {
    if (!top) return;
    navigate(`/restaurants/${top.restaurant_id}`, {
      state: { fromFeed: true },
    });
  }

  /* -------------------------------
   * 카드 소진 감지
   * ----------------------------- */
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

  /* -------------------------------
   * UI 렌더링
   * ----------------------------- */
  return (
    <div className="relative h-dvh flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden">
        <SwipeOverlay offset={offset} finalDir={finalDir} visible={true} />

        {top ? (
          <FeedCard
            data={top}
            offset={offset}
            isDragging={isDragging}
            transitionEnabled={transitionEnabled}
            onMove={handleMove}
            onSwiped={handleSwiped}
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
              onClick={handleBookmark}
            />

            <CircularButton
              type="next"
              icon={<ArrowDown />}
              onClick={() => animateSwipe("up")}
            />

            <CircularButton
              type="info"
              icon={<CircleAlert />}
              onClick={handleInfo}
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
