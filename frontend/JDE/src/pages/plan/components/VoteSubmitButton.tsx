import { CheckCircle } from "lucide-react";

type VoteSubmitButtonProps = {
  hasVoted: boolean;
  hasSelectedRestaurant: boolean;
  isSubmitting: boolean;
  onVoteSubmit: () => void;
};

export function VoteSubmitButton({
  hasVoted,
  hasSelectedRestaurant,
  isSubmitting,
  onVoteSubmit,
}: VoteSubmitButtonProps) {
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex justify-center px-4">
      <button
        onClick={onVoteSubmit}
        disabled={!hasSelectedRestaurant || hasVoted || isSubmitting}
        className={`rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all duration-300 disabled:cursor-not-allowed hover:bg-primary active:scale-95 shadow-lg ${
          hasVoted ? "bg-primary/80" : "bg-primary hover:bg-primary"
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <span>{hasVoted ? "투표 완료" : "투표 제출"}</span>
        </div>
      </button>
    </div>
  );
}
