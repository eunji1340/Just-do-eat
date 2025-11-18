import { AlertCircle } from "lucide-react";

type EndVoteConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function EndVoteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: EndVoteConfirmModalProps) {
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
            투표를 종료하시겠어요?
          </h2>
          <p className="text-sm text-neutral-600">
            투표를 종료하고 최종 식당을 확정합니다
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border-2 border-neutral-300 bg-white text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 rounded-xl border-none bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
          >
            투표 종료
          </button>
        </div>
      </div>
    </div>
  );
}
