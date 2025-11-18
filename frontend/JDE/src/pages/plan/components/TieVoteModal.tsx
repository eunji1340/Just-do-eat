import { AlertCircle, Vote, UserCheck } from "lucide-react";

type TieVoteModalProps = {
  isOpen: boolean;
  tiedCount: number;
  voteCount: number;
  onClose: () => void;
  onRevote: () => void;
  onManagerSelect: () => void;
};

export function TieVoteModal({
  isOpen,
  tiedCount,
  voteCount,
  onClose,
  onRevote,
  onManagerSelect,
}: TieVoteModalProps) {
  if (!isOpen) return null;

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
          <h2 className="text-lg font-bold text-neutral-900 mb-2">
            동점이 발생했습니다!
          </h2>
          <p className="text-sm text-neutral-600">
            {tiedCount}개 식당이 {voteCount}표로 동점입니다
            <br />
            어떻게 진행하시겠어요?
          </p>
        </div>

        <div className="space-y-3 mb-4">
          <button
            onClick={onRevote}
            className="w-full rounded-xl border-2 border-primary bg-white p-4 text-left transition-all hover:bg-primary/20"
          >
            <div className="flex items-center gap-3">
              <Vote className="h-6 w-6 text-primary" />
              <div>
                <p className="font-semibold text-neutral-900">재투표</p>
                <p className="text-sm text-neutral-600">
                  동점인 식당들로 다시 투표합니다
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={onManagerSelect}
            className="w-full rounded-xl border-2 border-primary bg-white p-4 text-left transition-all hover:bg-primary/20"
          >
            <div className="flex items-center gap-3">
              <UserCheck className="h-6 w-6 text-primary" />
              <div>
                <p className="font-semibold text-neutral-900">직접 선택</p>
                <p className="text-sm text-neutral-600">
                  주최자가 직접 선택합니다
                </p>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-neutral-100 py-3 text-sm font-semibold text-neutral-700 transition-all hover:bg-neutral-200"
        >
          취소
        </button>
      </div>
    </div>
  );
}
