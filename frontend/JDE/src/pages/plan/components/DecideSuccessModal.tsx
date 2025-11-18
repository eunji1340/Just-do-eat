import { CheckCircle } from "lucide-react";

type DecideSuccessModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function DecideSuccessModal({
  isOpen,
  onClose,
}: DecideSuccessModalProps) {
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
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">
            식당이 확정되었습니다!
          </h2>
          <p className="text-sm text-neutral-600">
            약속의 최종 식당이 선택되었어요
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  );
}
