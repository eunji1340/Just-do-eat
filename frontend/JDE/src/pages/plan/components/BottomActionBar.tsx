import { Dices, MousePointerClick } from "lucide-react";

type BottomActionBarProps = {
  bottomButtonsRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  hasRestaurants: boolean;
  directSelectMode: boolean;
  hasSelectedRestaurant: boolean;
  onSelectToolClick: () => void;
  onDirectSelect: () => void;
  onDirectSelectComplete: () => void;
};

export function BottomActionBar({
  bottomButtonsRef,
  isLoading,
  hasRestaurants,
  directSelectMode,
  hasSelectedRestaurant,
  onSelectToolClick,
  onDirectSelect,
  onDirectSelectComplete,
}: BottomActionBarProps) {
  return (
    <nav
      ref={bottomButtonsRef}
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full min-w-[320px] sm:max-w-[640px] bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
      aria-label="결정 도구 선택"
    >
      <div className="flex h-full items-center justify-between gap-2 px-4 pt-2 pb-4">
        <button
          onClick={onSelectToolClick}
          disabled={isLoading || !hasRestaurants}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-primary hover:text-white active:scale-95"
        >
          <Dices className="h-5 w-5" />
          <span>결정 도구 선택</span>
        </button>

        <button
          onClick={
            directSelectMode && hasSelectedRestaurant
              ? onDirectSelectComplete
              : onDirectSelect
          }
          disabled={isLoading || !hasRestaurants}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-primary hover:text-white active:scale-95"
        >
          <MousePointerClick className="h-5 w-5" />
          <span>
            {directSelectMode && hasSelectedRestaurant ? "결정" : "바로 선택"}
          </span>
        </button>
      </div>
    </nav>
  );
}

