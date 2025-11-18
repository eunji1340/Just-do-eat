import { X, Trophy } from "lucide-react";

type ComingSoonModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ComingSoonModal({ isOpen, onClose }: ComingSoonModalProps) {
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
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">
            토너먼트 기능
          </h2>
          <p className="text-sm text-neutral-600">
            추후 구현 예정입니다
            <br />
            조금만 기다려주세요!
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
