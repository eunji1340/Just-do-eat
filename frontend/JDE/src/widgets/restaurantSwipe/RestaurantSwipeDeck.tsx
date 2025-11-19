// src/widgets/restaurantSwipe/RestaurantSwipeDeck.tsx

import * as React from "react";
import { useNavigate } from "react-router-dom";
import SwipeCard from "@/features/feed/FeedCard";
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
  // 🔥 기본 300 → 700ms 정도로 살짝 느리게 (체감용)
  overlayHoldMs = 700,
  onDeckEmpty,
  hasMore = true,
}: Props) {
  const navigate = useNavigate();
  const [index, setIndex] = React.useState(0);
  const [offset, setOffset] = React.useState<Offset>({ x: 0, y: 0 });
  const [finalDir, setFinalDir] = React.useState<
    "left" | "right" | "up" | null
  >(null);
  const [overlayVisible, setOverlayVisible] = React.useState(true);
  const [emptyNotified, setEmptyNotified] = React.useState(false);

  const top = items[index];

  function handleMove(o: Offset) {
    setOffset(o);
    setFinalDir(null); // 드래그 중엔 확정 오버레이 숨김
    setOverlayVisible(true);
  }

  function handleSwiped(dir: "left" | "right" | "up") {
    const cur = items[index];
    if (!cur) return;

    // ✅ 여기서 공통으로 모달/오버레이 상태 세팅
    setFinalDir(dir); // 어떤 액션인지 저장 (갈게요/싫어요/보류)
    setOverlayVisible(true); // 모달/오버레이 보이게

    onTopSwiped?.(dir, cur); // 백엔드 액션 + 라우팅은 SwipePage에서

    // 일정 시간 후 다음 카드로 넘기기
    window.setTimeout(() => {
      setIndex((i) => i + 1);
      setFinalDir(null);
      setOffset({ x: 0, y: 0 });
      setOverlayVisible(false);
      requestAnimationFrame(() => setOverlayVisible(true));
    }, overlayHoldMs);
  }

  // 버튼 클릭 시 스와이프 애니메이션 트리거
  function triggerSwipeAnimation(dir: "left" | "right" | "up") {
    // 방향에 따라 최종 offset 계산
    const targetOffset =
      dir === "left"
        ? { x: -window.innerWidth, y: 0 }
        : dir === "right"
        ? { x: window.innerWidth, y: 0 }
        : { x: 0, y: -window.innerHeight };

    // offset 애니메이션
    setOffset(targetOffset);

    // 애니메이션 완료 후 handleSwiped 호출
    window.setTimeout(() => {
      handleSwiped(dir);
    }, 300); // 애니메이션 시간
  }

  React.useEffect(() => {
    if (!onDeckEmpty) return;

    const noMoreCards = index >= items.length && items.length > 0;

    if (noMoreCards && !emptyNotified) {
      setEmptyNotified(true);
      onDeckEmpty();
    }

    // 새 카드가 추가되면 다시 열 수 있게 플래그 리셋
    if (items.length > index && emptyNotified) {
      setEmptyNotified(false);
    }
  }, [index, items.length, onDeckEmpty, emptyNotified]);

  // 북마크 버튼 핸들러
  async function handleBookmark() {
    const cur = items[index];
    if (!cur) return;

    // 로그인 체크
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    try {
      await http.post(`/restaurants/${cur.restaurant_id}/bookmark`);
      console.log(`✅ [북마크] 추가 성공 - restaurantId: ${cur.restaurant_id}`);
      alert("북마크에 추가되었습니다!");
    } catch (err) {
      console.error("[북마크] 추가 실패:", err);
      alert("북마크 추가에 실패했습니다.");
    }
  }

  // 정보 버튼 핸들러 (식당 상세 페이지로 이동)
  function handleInfo() {
    const cur = items[index];
    if (!cur) return;

    // 피드에서 진입했다는 정보를 state로 전달
    navigate(`/restaurants/${cur.restaurant_id}`, {
      state: { fromFeed: true },
    });
  }

  return (
    <div className="relative h-dvh flex items-center justify-center overflow-hidden">
      {/* 기존 스와이프 오버레이(모서리 띠 등) */}
      <SwipeOverlay
        offset={offset}
        finalDir={finalDir}
        visible={overlayVisible}
      />

      {/* 카드 */}
      {top ? (
        <SwipeCard data={top} onMove={handleMove} onSwiped={handleSwiped} />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 text-sm">
          {hasMore ? (
            <span>다음 추천을 불러오는 중입니다...</span>
          ) : (
            <span>더 이상 카드가 없어요</span>
          )}
        </div>
      )}

      {/* 하단 스와이프 보조도구 (카드 있을 때만) */}
      {top && (
        <div className="pointer-events-none absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4">
          <div className="pointer-events-auto flex items-center gap-4">
            <CircularButton
              type="dislike"
              icon={<X strokeWidth={5} />}
              onClick={() => triggerSwipeAnimation("left")}
              aria-label="싫어요"
            />
            <CircularButton
              type="bookmark"
              icon={<Star strokeWidth={3} />}
              onClick={handleBookmark}
              aria-label="북마크"
            />
            <CircularButton
              type="next"
              icon={<ArrowDown strokeWidth={4} />}
              onClick={() => triggerSwipeAnimation("up")}
              aria-label="보류"
            />
            <CircularButton
              type="info"
              icon={<CircleAlert strokeWidth={3} />}
              onClick={handleInfo}
              aria-label="정보"
            />
            <CircularButton
              type="confirm"
              icon={<Check strokeWidth={5} />}
              onClick={() => triggerSwipeAnimation("right")}
              aria-label="갈게요"
            />
          </div>
        </div>
      )}
    </div>
  );
}
