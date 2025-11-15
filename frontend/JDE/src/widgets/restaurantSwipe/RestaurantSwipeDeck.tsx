// src/widgets/restaurantSwipe/RestaurantSwipeDeck.tsx
// 목적: 덱(스택) 관리 + 전체 화면 오버레이 제어(확정 후 잠깐 유지)

import * as React from "react";
import SwipeCard from "@/features/swipe/SwipeCard";
import SwipeOverlay from "./SwipeOverlay";
import type { Restaurant } from "@/entities/restaurant/types";
import type { Offset } from "@/features/swipe/useSwipeHandler";
import { X, Check, ArrowDown, CircleAlert, Star } from "lucide-react";
import { CircularButton } from "@/shared/ui/button/circular-button";

type Props = {
  items: Restaurant[];
  onTopSwiped?: (dir: "left" | "right" | "up", item: Restaurant) => void;
  overlayHoldMs?: number;
  // 🔥 추가: 카드가 모두 소진됐을 때 부모에게 알리는 콜백
  onDeckEmpty?: () => void;
  // 🔥 추가: 더 로드할 게 있는지 여부 (없으면 "더 이상 카드가 없어요" 문구 노출)
  hasMore?: boolean;
};

export default function RestaurantSwipeDeck({
  items,
  onTopSwiped,
  overlayHoldMs = 300,
  onDeckEmpty,
  hasMore = true,
}: Props) {
  const [index, setIndex] = React.useState(0);
  const [offset, setOffset] = React.useState<Offset>({ x: 0, y: 0 });
  const [finalDir, setFinalDir] = React.useState<"left" | "right" | "up" | null>(
    null
  );
  const [overlayVisible, setOverlayVisible] = React.useState(true);
  const [emptyNotified, setEmptyNotified] = React.useState(false);

  const top = items[index];

  function handleMove(o: Offset) {
    setOffset(o);
    setFinalDir(null);
    setOverlayVisible(true);
  }

  function handleSwiped(dir: "left" | "right" | "up") {
    const cur = items[index];
    if (!cur) return;

    setFinalDir(dir);
    setOverlayVisible(true);
    onTopSwiped?.(dir, cur);

    window.setTimeout(() => {
      setIndex((i) => i + 1);
      setFinalDir(null);
      setOffset({ x: 0, y: 0 });
      setOverlayVisible(false);
      requestAnimationFrame(() => setOverlayVisible(true));
    }, overlayHoldMs);
  }

  // ✅ index가 items.length 이상이 되면, 한 번만 onDeckEmpty 호출
  React.useEffect(() => {
    if (!onDeckEmpty) return;

    const noMoreCards = index >= items.length && items.length > 0;

    if (noMoreCards && !emptyNotified) {
      setEmptyNotified(true);
      onDeckEmpty();
    }

    // 새 아이템이 추가되면 다시 스와이프 가능 → 플래그 리셋
    if (items.length > index && emptyNotified) {
      setEmptyNotified(false);
    }
  }, [index, items.length, onDeckEmpty, emptyNotified]);

  return (
    <div className="relative h-dvh flex items-center justify-center overflow-hidden">
      {/* 오버레이 */}
      <SwipeOverlay offset={offset} finalDir={finalDir} visible={overlayVisible} />

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

      {/* 하단 스와이프 보조도구 */}
      {top && (
        <div className="pointer-events-none absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4">
          <div className="pointer-events-auto flex items-center gap-4">
            <CircularButton
              type="dislike"
              icon={<X />}
              onClick={() => handleSwiped("left")}
              aria-label="싫어요"
            />
            <CircularButton
              type="bookmark"
              icon={<Star />}
              onClick={() => handleSwiped("left")}
              aria-label="북마크 (임시로 DISLIKE와 동일 방향)"
            />
            <CircularButton
              type="next"
              icon={<ArrowDown />}
              onClick={() => handleSwiped("up")}
              aria-label="보류"
            />
            <CircularButton
              type="info"
              icon={<CircleAlert />}
              onClick={() => handleSwiped("up")}
              aria-label="정보 (임시로 HOLD와 동일 방향)"
            />
            <CircularButton
              type="confirm"
              icon={<Check />}
              onClick={() => handleSwiped("right")}
              aria-label="갈게요"
            />
          </div>
        </div>
      )}
    </div>
  );
}
