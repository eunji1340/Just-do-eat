// src/widgets/restaurantSwipe/RestaurantSwipeDeck.tsx

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

  // 🔥 방향별 라벨 & 색상
  function getConfirmInfo(dir: "left" | "right" | "up") {
    switch (dir) {
      case "right":
        return {
          label: "갈게요",
          sub: "이 식당으로 결정했어요",
          theme: "confirm",
        };
      case "left":
        return {
          label: "싫어요",
          sub: "이 식당은 제외했어요",
          theme: "dislike",
        };
      case "up":
      default:
        return { label: "보류", sub: "일단 후보에 남겨둘게요", theme: "hold" };
    }
  }

  return (
    <div className="relative h-dvh flex items-center justify-center overflow-hidden">
      {/* 기존 스와이프 오버레이(모서리 띠 등) */}
      <SwipeOverlay
        offset={offset}
        finalDir={finalDir}
        visible={overlayVisible}
      />

      {/* 🔥 스와이프 확정 후 전체 화면 오버레이 */}
      {finalDir && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
          {(() => {
            const info = getConfirmInfo(finalDir);
            const bg =
              info.theme === "confirm"
                ? "bg-emerald-500"
                : info.theme === "dislike"
                ? "bg-red-500"
                : "bg-amber-500";

            return (
              <div className="rounded-3xl px-8 py-6 bg-white/90 shadow-2xl text-center">
                <div
                  className={`inline-block rounded-full px-4 py-1 text-xs font-semibold text-white ${bg}`}
                >
                  {info.label}
                </div>
                <h2 className="mt-3 text-2xl font-extrabold text-gray-900">
                  {info.label}
                </h2>
                <p className="mt-1 text-sm text-gray-600">{info.sub}</p>
              </div>
            );
          })()}
        </div>
      )}

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
              icon={<X />}
              onClick={() => handleSwiped("left")}
              aria-label="싫어요"
            />
            <CircularButton
              type="bookmark"
              icon={<Star />}
              onClick={() => handleSwiped("left")} // TODO: 북마크 액션 따로 분리 가능
              aria-label="북마크"
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
              onClick={() => handleSwiped("up")} // TODO: 상세보기 모달로 변경 가능
              aria-label="정보"
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
