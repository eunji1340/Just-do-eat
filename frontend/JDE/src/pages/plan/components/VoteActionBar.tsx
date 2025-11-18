import { Hourglass } from "lucide-react";

type VoteActionBarProps = {
  bottomButtonsRef: React.RefObject<HTMLDivElement | null>;
  onEndVote: () => void;
};

export function VoteActionBar({
  bottomButtonsRef,
  onEndVote,
}: VoteActionBarProps) {
  return (
    <nav
      ref={bottomButtonsRef}
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full min-w-[320px] sm:max-w-[640px] bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
      aria-label="투표 종료"
    >
      <div className="flex h-full items-center justify-center px-4 pt-2 pb-4">
        <button
          onClick={onEndVote}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition-all duration-300 hover:bg-primary hover:text-white active:scale-95"
        >
          <Hourglass className="h-5 w-5" />
          <span>투표 종료</span>
        </button>
      </div>
    </nav>
  );
}
