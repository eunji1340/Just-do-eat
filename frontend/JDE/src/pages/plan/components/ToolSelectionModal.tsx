import { Vote, ChartPie, Trophy, CheckCircle2 } from "lucide-react";

type ToolSelectionModalProps = {
  isOpen: boolean;
  restaurantCount: number;
  onClose: () => void;
  onSelectTool: (toolType: "VOTE" | "LADDER" | "ROULETTE") => void;
};

export function ToolSelectionModal({
  isOpen,
  restaurantCount,
  onClose,
  onSelectTool,
}: ToolSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 px-4 pb-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-neutral-900">결정 도구 선택</h2>

        <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-neutral-900">
                현재 화면의 {restaurantCount}개 식당이 선택됩니다
              </p>
              <p className="text-xs text-neutral-600 mt-0.5">
                결정 도구를 선택해주세요
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onSelectTool("VOTE")}
            className="w-full rounded-xl border-2 border-primary bg-white p-4 text-left transition-all hover:bg-primary/20"
          >
            <div className="flex items-center gap-3">
              <Vote className="h-6 w-6 text-primary" />
              <div>
                <p className="font-semibold text-neutral-900">투표</p>
                <p className="text-sm text-neutral-600">
                  참가자들이 투표로 선택합니다
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelectTool("ROULETTE")}
            className="w-full rounded-xl border-2 border-primary bg-white p-4 text-left transition-all hover:bg-primary/20"
          >
            <div className="flex items-center gap-3">
              <ChartPie className="h-6 w-6 text-primary" />
              <div>
                <p className="font-semibold text-neutral-900">룰렛</p>
                <p className="text-sm text-neutral-600">
                  룰렛을 돌려서 선택합니다
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelectTool("LADDER")}
            className="w-full rounded-xl border-2 border-primary bg-white p-4 text-left transition-all hover:bg-primary/20"
          >
            <div className="flex items-center gap-3">
              <Trophy className="h-6 w-6 text-primary" />
              <div>
                <p className="font-semibold text-neutral-900">토너먼트</p>
                <p className="text-sm text-neutral-600">
                  토너먼트로 최종 선택합니다
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
