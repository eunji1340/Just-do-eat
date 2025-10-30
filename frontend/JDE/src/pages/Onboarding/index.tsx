// =============================================
// src/pages/onboarding/index.tsx
// =============================================
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MukbtiFlow from '../../features/Onboarding/MukbtiTest/ui/mukbti-flow';
import BingoFlow from '../../features/Onboarding/Bingo/ui/bingo-flow';
import { useUserStore } from '../../entities/user/model/user-store';

export default function OnboardingPage() {
  const loc = useLocation() as { state?: { step?: 'mukbti' | 'bingo' } };
  const nav = useNavigate();
  const initial = loc.state?.step ?? 'mukbti';
  const [step, setStep] = React.useState<'mukbti' | 'bingo'>(initial);
  const { mukbtiAnswers, setMukbtiResult, setTagPrefs } = useUserStore();

  // 먹BTI 완료 시
  const handleMukbtiDone = () => {
    setStep('bingo');
  };

  // 빙고 완료 시 - 통합 POST 요청
  const handleBingoDone = async (bingoResponses: Array<{ id: string; vote: number }>) => {
    try {
      const response = await fetch('/api/onboarding/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mukbtiAnswers,
          bingoResponses,
        }),
      });

      if (!response.ok) throw new Error('온보딩 결과 저장 실패');

      const data = await response.json();
      
      // 결과 저장
      setMukbtiResult(data.mukbtiResult);
      setTagPrefs(data.tagPrefs);

      // 결과 페이지로 이동
      nav(`/onboarding/result?typeId=${data.typeId}`);
    } catch (error) {
      console.error('온보딩 결과 저장 오류:', error);
      alert('결과 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <>
      {step === 'mukbti' ? (
        <MukbtiFlow onDone={handleMukbtiDone} />
      ) : (
        <BingoFlow onComplete={handleBingoDone} />
      )}
    </>
  );
}
