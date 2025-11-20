import { CheckCircle } from "lucide-react";

type VoteSubmitButtonProps = {
  hasSelectedRestaurant: boolean;
  isSubmitting: boolean;
  onVoteSubmit: () => void;
};

export function VoteSubmitButton({
  hasSelectedRestaurant,
  isSubmitting,
  onVoteSubmit,
}: VoteSubmitButtonProps) {
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex justify-center px-4">
      <button
        onClick={onVoteSubmit}
        disabled={!hasSelectedRestaurant || isSubmitting}
        className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all duration-300 disabled:cursor-not-allowed hover:bg-primary active:scale-95 shadow-lg bg-primary hover:bg-primary"
      >
        <div className="flex items-center justify-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <span>투표 제출</span>
        </div>
      </button>
    </div>
  );
}
