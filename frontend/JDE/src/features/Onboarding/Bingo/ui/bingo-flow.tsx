// --------------------------------------------
// features/Onboarding/Bingo/ui/bingo-flow.tsx
// --------------------------------------------
import * as React from 'react';
import BingoBoard from './bingo-board';
import { useBingoTriState } from '../model/bingo-logic';
import type { Tri, BingoItem } from '../model/bingo-types';
import { useUserStore } from '../../../../entities/user/model/user-store';

export type BingoFlowProps = {
  onComplete?: (bingoResponses: Array<{ id: string; vote: number }>) => Promise<void>;
};

export default function BingoFlow({ onComplete }: BingoFlowProps) {
  const { setBingoLikes } = useUserStore();
  const { state, set } = useBingoTriState();
  const [bingoItems, setBingoItems] = React.useState<BingoItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // 서버에서 빙고 보드 로드
  React.useEffect(() => {
    fetch('/api/onboarding/bingo')
      .then((res) => res.json())
      .then((data) => {
        setBingoItems(data.items || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
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
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center'
      }}>
        <p>빙고 보드를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16
      }}>
        <p style={{ color: '#a00' }}>오류: {error}</p>
        <button onClick={() => window.location.reload()} style={{ padding: '12px 20px', borderRadius: 8, cursor: 'pointer' }}>
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      display: 'flex', 
      flexDirection: 'column',
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      overflow: 'hidden'
    }}>
      <h2 style={{ margin: '0 0 8px 0', textAlign: 'center' }}>호불호 빙고 (5×5)</h2>
      <p style={{ margin: '0 0 16px 0', color: '#666', textAlign: 'center' }}>
        각 칸을 클릭해 선호도를 선택하세요: SKIP → LIKE → DISLIKE
      </p>
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <BingoBoard 
          items={bingoItems}
          value={state} 
          onChange={(next) => Object.entries(next).forEach(([k,v]) => set(+k, v as Tri))} 
        />
      </div>

      <button 
        onClick={handleSubmit}
        disabled={submitting}
        style={{ 
          padding:'16px 20px', 
          borderRadius:12, 
          background: submitting ? '#999' : '#222', 
          color:'#fff', 
          border:0, 
          cursor: submitting ? 'not-allowed' : 'pointer',
          marginTop: '16px',
          fontSize: '16px'
        }}
      >
        {submitting ? '처리 중...' : '완료'}
      </button>
    </div>
  );
}
