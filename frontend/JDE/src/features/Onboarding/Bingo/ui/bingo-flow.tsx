// --------------------------------------------
// features/Onboarding/Bingo/ui/bingo-flow.tsx
// --------------------------------------------
import * as React from 'react';
import BingoBoard from './bingo-board';
import { useUserStore } from '../../../../entities/user/model/user-store';
import customAxios from '../../../../shared/api/http';

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
  onComplete?: (bingoResponses: Array<{ id: string; vote: number }>) => Promise<void>;
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
  const set = (idx: number, v: VoteValue) => setState((s) => ({ ...s, [idx]: v }));

  // 서버에서 빙고 보드 로드
  React.useEffect(() => {
    customAxios({
      method: 'GET',
      url: '/onboarding/bingo',
      meta: { authRequired: false }
    })
      .then((response: any) => {
        const data: BingoItemsResponse = response.data;
        setBingoItems(data.items || []);
        setLoading(false);
      })
      .catch((err: any) => {
        const errorMessage = err.response?.data?.message || err.message || '빙고 보드를 불러오는데 실패했습니다.';
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
        liked: (state[idx] ?? 0) === 1 
      }));
      setBingoLikes(likes);

      // 2) 빙고 응답 데이터 준비
      const bingoResponses = bingoItems.map((item, idx) => ({ 
        id: item.id, 
        vote: (state[idx] ?? 0) as number 
      }));

      // 3) 상위 컴포넌트로 전달 (통합 POST)
      if (onComplete) {
        await onComplete(bingoResponses);
      }
    } catch (err) {
      console.error('빙고 완료 처리 실패:', err);
      setError('처리 중 오류가 발생했습니다.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-bg)]">
        <p className="text-[var(--color-fg)]">빙고 보드를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--color-bg)]">
        <p className="text-[var(--color-error)]">오류: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-5 py-3 rounded-lg bg-[var(--color-primary)] text-white cursor-pointer hover:bg-[var(--color-s2)] transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col p-5 max-w-xl mx-auto bg-[var(--color-bg)] overflow-hidden">
      <h2 className="m-0 mb-2 text-center text-xl font-semibold text-[var(--color-fg)]">호불호 빙고 (5×5)</h2>
      <p className="m-0 mb-4 text-[var(--color-muted)] text-center">
        각 칸을 클릭해 선호도를 선택하세요: SKIP → LIKE → DISLIKE
      </p>
      
      <div className="flex-1 flex items-center justify-center">
        <BingoBoard 
          items={bingoItems}
          value={state} 
          onChange={(next) => Object.entries(next).forEach(([k,v]) => set(+k, v as VoteValue))} 
        />
      </div>

      <button 
        onClick={handleSubmit}
        disabled={submitting}
        className={`
          py-4 px-5 rounded-xl border-0 cursor-pointer mt-4 text-base
          transition-colors w-full mx-auto
          ${submitting 
            ? 'bg-gray-400 cursor-not-allowed text-white' 
            : 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] hover:opacity-90'
          }
        `}
      >
        {submitting ? '처리 중...' : '완료'}
      </button>
    </div>
  );
}
