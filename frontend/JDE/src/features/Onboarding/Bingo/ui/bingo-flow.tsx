// --------------------------------------------
// features/Onboarding/Bingo/ui/bingo-flow.tsx
// --------------------------------------------
import * as React from "react";
import {
  Heart,
  ThumbsDown,
  RotateCcw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import BingoBoard from "./bingo-board";
import { useUserStore } from "../../../../entities/user/model/user-store";
import customAxios from "../../../../shared/api/http";

// 백엔드 API 응답 타입 (최소한의 정보만)
type BingoItem = {
  id: string;
  label: string;
};

// 호불호 선택 타입 (UI에서만 사용)
type VoteValue = -1 | 0 | 1; // DISLIKE | SKIP | LIKE

// 백엔드 API 응답 타입
type BingoItemsResponse = {
  items: BingoItem[];
};

export type BingoFlowProps = {
  onComplete?: (
    bingoResponses: Array<{ id: string; vote: number }>
  ) => Promise<void>;
};

export default function BingoFlow({ onComplete }: BingoFlowProps) {
  const { setBingoLikes } = useUserStore();
  // 빙고 상태 관리
  const [state, setState] = React.useState<Record<number, VoteValue>>({});
  const [bingoItems, setBingoItems] = React.useState<BingoItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // 빙고 상태 업데이트 함수
  const set = (idx: number, v: VoteValue) =>
    setState((s) => ({ ...s, [idx]: v }));

  // 서버에서 빙고 보드 로드
  React.useEffect(() => {
    customAxios({
      method: "GET",
      url: "/onboarding/bingo",
      meta: { authRequired: false },
    })
      .then((response: any) => {
        const data: BingoItemsResponse = response.data;
        setBingoItems(data.items || []);
        setLoading(false);
      })
      .catch((err: any) => {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "빙고 보드를 불러오는데 실패했습니다.";
        setError(errorMessage);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // 1) 기존 호환: LIKE만 true로 만들어 store 저장
      const likes = bingoItems.map((item, idx) => ({
        item: item.label,
        liked: (state[idx] ?? 0) === 1,
      }));
      setBingoLikes(likes);

      // 2) 빙고 응답 데이터 준비
      const bingoResponses = bingoItems.map((item, idx) => ({
        id: item.id,
        vote: (state[idx] ?? 0) as number,
      }));

      // 3) 상위 컴포넌트로 전달 (통합 POST)
      if (onComplete) {
        await onComplete(bingoResponses);
      }
    } catch (err) {
      console.error("빙고 완료 처리 실패:", err);
      setError("처리 중 오류가 발생했습니다.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin" />
          <p className="text-[var(--color-fg)] font-medium">
            빙고 보드를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 bg-[var(--color-bg)] p-6">
        <div className="bg-[var(--color-surface)] rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-[var(--color-border)]">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-red-600 font-semibold mb-2">오류가 발생했습니다</p>
          <p className="text-[var(--color-muted-fg)] mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-medium cursor-pointer hover:opacity-90 transition-all shadow-md hover:shadow-lg"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 선택된 항목 카운트
  const likeCount = Object.values(state).filter((v) => v === 1).length;
  const dislikeCount = Object.values(state).filter((v) => v === -1).length;

  return (
    <div className="fixed inset-0 flex flex-col bg-[var(--color-bg)]">
      <div className="flex-1 flex flex-col p-6 max-w-2xl mx-auto w-full overflow-auto">
        {/* 헤더 */}
        <div className="text-center mb-4 flex-shrink-0">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <h2 className="m-0 text-2xl font-bold text-[var(--color-fg)]">
              호불호 빙고
            </h2>
            <div className="w-2 h-2 rounded-full bg-[#FB2C36] animate-pulse"></div>
          </div>
          <p className="text-[var(--color-muted-fg)] text-sm m-0">
            각 항목을 탭해서 당신의 취향을 알려주세요!
          </p>
        </div>

        {/* 설명 + 통계 카드 (공간 통합) */}
        <div className="flex-shrink-0 bg-[var(--color-surface)] rounded-2xl shadow-md mb-4 border border-[var(--color-border)] overflow-hidden">
          {/* 탭 설명 영역 */}
          <div className="px-3 py-3 flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center border border-orange-200">
                <Heart className="w-4 h-4 text-primary fill-primary" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-[var(--color-fg)] m-0">
                  1번 탭
                </p>
                <p className="text-xs text-[var(--color-muted-fg)] m-0">
                  좋아요
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center border border-red-200">
                <ThumbsDown className="w-4 h-4 text-[#FB2C36]" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-[var(--color-fg)] m-0">
                  2번 탭
                </p>
                <p className="text-xs text-[var(--color-muted-fg)] m-0">
                  싫어요
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[var(--color-surface)] rounded-lg flex items-center justify-center border border-[var(--color-border)]">
                <RotateCcw className="w-4 h-4 text-[var(--color-muted-fg)]" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-[var(--color-fg)] m-0">
                  3번 탭
                </p>
                <p className="text-xs text-[var(--color-muted-fg)] m-0">
                  초기화
                </p>
              </div>
            </div>
          </div>

          {/* 통계 영역 */}
          <div className="border-t border-[var(--color-border)] px-2 py-1.5 flex gap-2">
            <div className="flex-1 bg-orange-50 rounded-lg px-2 py-1 text-center border border-orange-200">
              <p className="text-base font-bold text-orange-600 m-0 leading-tight">
                {likeCount}
              </p>
              <p className="text-xs text-orange-700 m-0 leading-tight">
                좋아요
              </p>
            </div>
            <div className="flex-1 bg-red-50 rounded-lg px-2 py-1 text-center border border-red-200">
              <p className="text-base font-bold text-red-600 m-0 leading-tight">
                {dislikeCount}
              </p>
              <p className="text-xs text-red-700 m-0 leading-tight">싫어요</p>
            </div>
          </div>
        </div>

        {/* 빙고 보드 */}
        <div className="flex-1 flex items-center justify-center mb-6">
          <BingoBoard
            items={bingoItems}
            value={state}
            onChange={(next) =>
              Object.entries(next).forEach(([k, v]) => set(+k, v as VoteValue))
            }
          />
        </div>

        {/* 완료 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`
            py-4 px-6 rounded-xl border-0 cursor-pointer text-base font-bold
            transition-all w-full shadow-md
            ${
              submitting
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-[var(--color-primary)] text-[var(--color-primary-fg)] hover:opacity-90 hover:shadow-lg"
            }
          `}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              처리 중...
            </span>
          ) : (
            "완료하기"
          )}
        </button>
      </div>
    </div>
  );
}
