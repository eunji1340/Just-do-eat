import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Restaurant } from "@/entities/plan/model/types";
import { RestaurantCard } from "@/widgets/plan/RestaurantCard";
import { cn } from "@/shared/lib/utils";

type RestaurantListProps = {
  restaurants: Restaurant[];
  isLoading: boolean;
  hasMore: boolean;
  currentHistoryIndex: number;
  directSelectMode: boolean;
  voteMode?: boolean;
  selectedRestaurantId: string | null;
  selectedTool: "VOTE" | "LADDER" | "ROULETTE" | "DIRECT" | null;
  restaurantListRef: React.RefObject<HTMLDivElement | null>;
  onRestaurantSelect: (restaurantId: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  getVoteCount?: (restaurantId: string) => number;
  totalParticipants?: number;
  currentVoteCount?: number;
  allowedRestaurantIds?: number[];
};

export function RestaurantList({
  restaurants,
  isLoading,
  hasMore,
  currentHistoryIndex,
  directSelectMode,
  voteMode = false,
  selectedRestaurantId,
  selectedTool,
  restaurantListRef,
  onRestaurantSelect,
  onPrevious,
  onNext,
  getVoteCount,
  totalParticipants,
  currentVoteCount,
  allowedRestaurantIds,
}: RestaurantListProps) {
  const navigate = useNavigate();
  if (isLoading) {
    return (
      <div className="px-4 pt-4">
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-neutral-500">식당 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="px-4 pt-4">
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
            <span className="text-4xl">🍽️</span>
          </div>
          <p className="text-sm font-medium text-neutral-500">
            아직 후보 식당이 없습니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={restaurantListRef} className="px-4 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-neutral-700">
          {restaurants.length}개의 후보 식당
        </p>
        {currentVoteCount !== undefined && totalParticipants !== undefined && (
          <p className="text-sm font-medium text-neutral-500">
            투표 인원 수 {currentVoteCount} / {totalParticipants}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {restaurants
          .filter((restaurant) => {
            // 재투표 모드이고 allowedRestaurantIds가 있으면 필터링
            if (allowedRestaurantIds && allowedRestaurantIds.length > 0) {
              return allowedRestaurantIds.includes(parseInt(restaurant.id, 10));
            }
            return true;
          })
          .map((restaurant) => {
            const isAllowed =
              !allowedRestaurantIds ||
              allowedRestaurantIds.length === 0 ||
              allowedRestaurantIds.includes(parseInt(restaurant.id, 10));

            return (
              <div
                key={restaurant.id}
                onClick={(e) => {
                  if ((directSelectMode || voteMode) && isAllowed) {
                    e.stopPropagation();
                    onRestaurantSelect(restaurant.id);
                  } else if (!directSelectMode && !voteMode) {
                    // 일반 모드일 때는 식당 상세 페이지로 이동
                    navigate(`/restaurants/${restaurant.id}`);
                  }
                }}
                className={!directSelectMode && !voteMode ? "cursor-pointer" : ""}
              >
                <RestaurantCard
                  restaurant={restaurant}
                  highlight={
                    ((selectedTool !== null && selectedTool !== "DIRECT") ||
                      directSelectMode ||
                      voteMode) &&
                    isAllowed
                  }
                  showRadio={(directSelectMode || voteMode) && isAllowed}
                  isSelected={selectedRestaurantId === restaurant.id}
                  onRadioClick={() => {
                    if ((directSelectMode || voteMode) && isAllowed) {
                      onRestaurantSelect(restaurant.id);
                    }
                  }}
                  voteCount={
                    getVoteCount ? getVoteCount(restaurant.id) : undefined
                  }
                  totalParticipants={totalParticipants}
                  showVoteCount={voteMode}
                  className={cn(
                    (directSelectMode || voteMode) &&
                      selectedRestaurantId === restaurant.id &&
                      isAllowed
                      ? "ring-2 ring-primary"
                      : "",
                    !isAllowed && voteMode ? "opacity-50" : ""
                  )}
                />
              </div>
            );
          })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={onPrevious}
          disabled={isLoading || currentHistoryIndex === 0}
          className="flex items-center gap-2 rounded-xl bg-white border-2 border-primary/30 px-6 py-3 text-sm font-semibold text-primary transition-all hover:border-primary hover:bg-primary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          <ChevronLeft className="h-5 w-5" />
          <span>이전 세트</span>
        </button>

        <button
          onClick={onNext}
          disabled={isLoading || !hasMore}
          className="flex items-center gap-2 rounded-xl bg-white border-2 border-primary/30 px-6 py-3 text-sm font-semibold text-primary transition-all hover:border-primary hover:bg-primary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          <span>다음 세트</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {!hasMore && (
        <div className="mt-4 flex items-center justify-center rounded-xl py-3">
          <p className="text-sm font-medium text-neutral-600">
            모든 후보를 불러왔습니다
          </p>
        </div>
      )}
    </div>
  );
}
