// 목적: 스와이프 덱 컨테이너 (FeedPage → 이 컴포넌트 사용)
//
// 주요 기능:
// 1) 카드 스와이프(좌/우/상) 제스처 처리
// 2) 카드 애니메이션 (날아가기 / 다음 카드 등장)
// 3) 비로그인 사용자는 좌/우 스와이프 제한 (위로만 가능)
// 4) 북마크 / 상세페이지 이동 기능 제공
// 5) 각 카드 전환 시 offset 초기화
//
// ※ 주의: SwipeCard는 offset / isDragging / resetHandler 등의 props를 더 이상 받지 않음
//    → 이 Deck 컴포넌트가 SwipeCard 최신 API에 맞춰 props를 전달해야 함.

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
  const [finalDir, setFinalDir] = React.useState<
    "left" | "right" | "up" | null
  >(null);
  const [emptyNotified, setEmptyNotified] = React.useState(false);

  const top = items[index];

  // 로그인 여부에 따라 좌/우 스와이프 제한
  const isLoggedIn = !!localStorage.getItem("accessToken");
  const verticalOnly = !isLoggedIn;

  /* -------------------------------
   * 드래그 중 offset 상태 업데이트
   * ----------------------------- */
  function handleMove(o: Offset) {
    setOffset(o);
    setFinalDir(null); // 드래그 중엔 확정 UI 숨김
  }

  /* -------------------------------
   * 스와이프 확정 처리
   * ----------------------------- */
  function handleSwiped(dir: "left" | "right" | "up") {
    const cur = items[index];
    if (!cur) return;

    // 로그인 안 했으면 좌/우 금지
    if (verticalOnly && (dir === "left" || dir === "right")) {
      setOffset({ x: 0, y: 0 });
      return;
    }

    setFinalDir(dir);
    onTopSwiped?.(dir, cur);

    // 오른쪽 → 선택 → 홈으로 이동
    if (dir === "right") {
      setTimeout(() => navigate("/"), 550);
      return;
    }

    // 왼쪽/위 → 다음 카드 전환
    setTimeout(showNextCard, overlayHoldMs);
  }

  /* -------------------------------
   * 다음 카드 등장 애니메이션
   * ----------------------------- */
  function showNextCard() {
    setIndex((i) => i + 1);

    // 다음 카드: 아래(y:200)에서 0으로 등장
    setOffset({ x: 0, y: 200 });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setOffset({ x: 0, y: 0 });
      });
    });

    setFinalDir(null);
  }

  /* -------------------------------
   * 버튼 클릭 → 애니메이션 + 스와이프 확정
   * ----------------------------- */
  function animateSwipe(dir: "left" | "right" | "up") {
    if (verticalOnly && (dir === "left" || dir === "right")) return;

    const dist = 900;

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

    if (!isLoggedIn) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    try {
      await http.post(`/restaurants/${top.restaurant_id}/bookmark`);
      alert("북마크에 추가되었습니다!");
    } catch {
      alert("북마크 추가 실패");
    }
  }

  /* -------------------------------
   * 상세 페이지 이동
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
            onMove={handleMove}
            onSwiped={handleSwiped}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            {hasMore ? "추천을 불러오는 중..." : "더 이상 카드가 없어요"}
          </div>
        )}
      </div>

      {/* 하단 버튼 UI */}
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
