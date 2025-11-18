import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Restaurant } from "@/entities/plan/model/types";
import { RestaurantCard } from "@/widgets/plan/RestaurantCard";
import { cn } from "@/shared/lib/utils";

type RestaurantListProps = {
  restaurants: Restaurant[];
  isLoading: boolean;
  hasMore: boolean;
  currentHistoryIndex: number;
  directSelectMode: boolean;
  selectedRestaurantId: string | null;
  selectedTool: "VOTE" | "LADDER" | "ROULETTE" | "DIRECT" | null;
  restaurantListRef: React.RefObject<HTMLDivElement | null>;
  onRestaurantSelect: (restaurantId: string) => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function RestaurantList({
  restaurants,
  isLoading,
  hasMore,
  currentHistoryIndex,
  directSelectMode,
  selectedRestaurantId,
  selectedTool,
  restaurantListRef,
  onRestaurantSelect,
  onPrevious,
  onNext,
}: RestaurantListProps) {
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
      </div>

      <div className="flex flex-col gap-3">
        {restaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            onClick={(e) => {
              if (directSelectMode) {
                e.stopPropagation();
                onRestaurantSelect(restaurant.id);
              }
            }}
          >
            <RestaurantCard
              restaurant={restaurant}
              highlight={
                (selectedTool !== null && selectedTool !== "DIRECT") ||
                directSelectMode
              }
              showRadio={directSelectMode}
              isSelected={selectedRestaurantId === restaurant.id}
              onRadioClick={() => {
                if (directSelectMode) {
                  onRestaurantSelect(restaurant.id);
                }
              }}
              className={cn(
                directSelectMode && selectedRestaurantId === restaurant.id
                  ? "ring-2 ring-primary"
                  : ""
              )}
            />
          </div>
        ))}
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

