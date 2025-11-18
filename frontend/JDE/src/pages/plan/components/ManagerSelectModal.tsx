import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { VoteResult } from "@/entities/plan/api/voteTally";

type ManagerSelectModalProps = {
  isOpen: boolean;
  tiedRestaurants: VoteResult[];
  restaurants: Array<{ id: string; name: string; category: string }>;
  onClose: () => void;
  onSelect: (restaurantId: number) => void;
};

export function ManagerSelectModal({
  isOpen,
  tiedRestaurants,
  restaurants,
  onClose,
  onSelect,
}: ManagerSelectModalProps) {
  if (!isOpen) return null;

  const [selectedId, setSelectedId] = React.useState<number | null>(null);

  const handleConfirm = () => {
    if (selectedId !== null) {
      onSelect(selectedId);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-neutral-900 mb-2">식당 선택</h2>
          <p className="text-sm text-neutral-600">
            동점인 식당 중 하나를 선택해주세요
          </p>
        </div>

        <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
          {tiedRestaurants.map((result) => {
            const restaurant = restaurants.find(
              (r) => parseInt(r.id, 10) === result.restaurantId
            );
            const isSelected = selectedId === result.restaurantId;

            return (
              <button
                key={result.restaurantId}
                onClick={() => setSelectedId(result.restaurantId)}
                className={cn(
                  "w-full rounded-xl border-2 p-4 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-neutral-200 bg-white hover:border-primary/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-neutral-900">
                      {restaurant?.name || `식당 #${result.restaurantId}`}
                    </p>
                    {restaurant?.category && (
                      <p className="text-sm text-neutral-600 mt-0.5">
                        {restaurant.category}
                      </p>
                    )}
                    <p className="text-xs text-neutral-500 mt-1">
                      {result.votes}표
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="w-6 h-6 text-primary flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border-2 border-neutral-300 bg-white text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedId === null}
            className="flex-1 py-3 px-4 rounded-xl border-none bg-primary text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            확정
          </button>
        </div>
      </div>
    </div>
  );
}
