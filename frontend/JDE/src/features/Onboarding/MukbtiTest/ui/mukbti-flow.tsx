// ---------------------------------------------
// features/Onboarding/MukbtiTest/ui/mukbti-flow.tsx
// ---------------------------------------------
import * as React from 'react';
import type { MukbtiAnswer, Question } from '../model/types';
import { useUserStore } from '../../../../entities/user/model/user-store';

export type MukbtiFlowProps = {
  onDone?: () => void;
};

export default function MukbtiFlow({ onDone }: MukbtiFlowProps) {
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<MukbtiAnswer[]>([]);
  const { setMukbtiAnswers } = useUserStore();
  
  // 서버에서 모든 질문 로드
  React.useEffect(() => {
    fetch('/api/onboarding/mbtis')
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data.items || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // 질문 흐름 관리 (기존 useMukbtiFlow 로직을 인라인으로)
  const current = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const progress = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;
  const goNext = () => setCurrentIndex((i) => Math.min(i + 1, questions.length - 1));

  const handleSelect = (choiceId: string) => {
    // 1. 새로운 답변 배열 생성
    const next = [...answers.filter((p) => p.qid !== current.id), { qid: current.id, choiceId }];
    
    // 2. 로컬 상태 업데이트
    setAnswers(next);
    
    // 3. 마지막 질문인 경우
    if (isLast) {
      // 답변을 store에 저장하고 다음 단계로
      setMukbtiAnswers(next);
      onDone?.();
    } else {
      // 4. 다음 질문으로 이동
      goNext();
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
        <p>질문을 불러오는 중...</p>
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

  if (!questions.length || !current) {
    return <div>질문이 없습니다.</div>;
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
      margin: '0 auto'
    }}>
      {/* 상단 고정 진행바 */}
      <div style={{ marginBottom: '20px' }}>
        <div aria-label="progress" style={{ height: 8, background: '#eee', borderRadius: 999 }}>
          <div style={{ width: `${progress}%`, height: '100%', background: '#222', borderRadius: 999 }} />
        </div>
      </div>

      {/* 중앙 질문 영역 */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        overflow: 'auto'
      }}>
        <h2 style={{ margin: 0, textAlign: 'center', fontSize: '24px' }}>{current.text}</h2>
      </div>

      {/* 하단 고정 선택지 */}
      <div style={{ 
        display: 'grid', 
        gap: 12,
        marginTop: '20px'
      }}>
        {current.choices.map((c) => (
          <button
            key={c.id}
            onClick={() => handleSelect(c.id)}
            style={{ 
              padding: '16px 20px', 
              borderRadius: 12, 
              border: '1px solid #ddd', 
              background: '#222', 
              color: '#fff', 
              textAlign: 'left', 
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            {c.text}
          </button>
        ))}
      </div>
    </div>
  );
}
