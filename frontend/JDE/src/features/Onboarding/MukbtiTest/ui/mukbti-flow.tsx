// ---------------------------------------------
// features/Onboarding/MukbtiTest/ui/mukbti-flow.tsx
// ---------------------------------------------
import * as React from 'react';
import { useUserStore } from '../../../../entities/user/model/user-store';
import customAxios from '../../../../shared/api/http';

// 백엔드 API 응답 타입 (최소한의 정보만)
type MukbtiChoice = {
  id: string;
  text: string;
};

type MukbtiQuestion = {
  id: string;
  text: string;
  choices: MukbtiChoice[];
};

type MukbtiAnswer = {
  qid: string;
  choiceId: string;
};

// 백엔드 API 응답 타입
type MukbtiQuestionsResponse = {
  items: MukbtiQuestion[];
};

export type MukbtiFlowProps = {
  onDone?: () => void;
};

export default function MukbtiFlow({ onDone }: MukbtiFlowProps) {
  const [questions, setQuestions] = React.useState<MukbtiQuestion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<MukbtiAnswer[]>([]);
  const { setMukbtiAnswers } = useUserStore();
  
  // 서버에서 모든 질문 로드
  React.useEffect(() => {
    customAxios({
      method: 'GET',
      url: '/onboarding/mbtis',
      meta: { authRequired: false }
    })
      .then((response: any) => {
        const data: MukbtiQuestionsResponse = response.data.data;
        setQuestions(data.items || []);
        setLoading(false);
      })
      .catch((err: any) => {
        const errorMessage = err.response?.data?.message || err.message || '질문을 불러오는데 실패했습니다.';
        setError(errorMessage);
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
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-bg)]">
        <p className="text-[var(--color-fg)]">질문을 불러오는 중...</p>
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

  if (!questions.length || !current) {
    return <div className="text-[var(--color-fg)]">질문이 없습니다.</div>;
  }

  return (
    <div className="fixed inset-0 flex flex-col p-5 max-w-xl mx-auto bg-[var(--color-bg)]">
      {/* 상단 고정 진행바 */}
      <div className="mb-5">
        <div 
          aria-label="progress" 
          className="h-2 bg-[var(--color-surface)] rounded-full overflow-hidden"
        >
          <div 
            className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 중앙 질문 영역 (연한 회색 박스 내에 질문 번호와 함께 표시) */}
      <div className="flex-1 flex items-center justify-center overflow-auto">
        <div className="w-full p-6 rounded-xl bg-[var(--color-surface)]">
          <h2 className="m-0 text-2xl font-semibold text-left text-[var(--color-fg)] break-keep">
            Q{currentIndex + 1}.<br />{current.text}
          </h2>
        </div>
      </div>

      {/* 하단 고정 선택지 (간격 확대 및 텍스트 가운데 정렬) */}
      <div className="mt-5 grid gap-4">
        {current.choices.map((c) => (
          <button
            key={c.id}
            onClick={() => handleSelect(c.id)}
            className="px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-primary)] text-[var(--color-primary-fg)] text-center cursor-pointer hover:opacity-90 transition-colors text-base"
          >
            {c.text}
          </button>
        ))}
      </div>
    </div>
  );
}
