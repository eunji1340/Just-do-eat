// =============================================
// src/pages/onboarding/index.tsx
// =============================================
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MukbtiFlow from '../../features/Onboarding/MukbtiTest/ui/mukbti-flow';
import BingoFlow from '../../features/Onboarding/Bingo/ui/bingo-flow';
import { useUserStore } from '../../entities/user/model/user-store';
import customAxios from '../../shared/api/http';

export default function OnboardingPage() {
  const loc = useLocation() as { state?: { step?: 'mukbti' | 'bingo' } };
  const nav = useNavigate();
  const initial = loc.state?.step ?? 'mukbti';
  const [step, setStep] = React.useState<'mukbti' | 'bingo'>(initial);
  const { mukbtiAnswers, setMukbtiResult, onboardingSessionId, setOnboardingSessionId } = useUserStore();

  // 온보딩 시작 시 세션 발급
  React.useEffect(() => {
    // 세션이 이미 있으면 발급하지 않음
    if (onboardingSessionId) return;

    const issueSession = async () => {
      try {
        const response = await customAxios({
          method: 'POST',
          url: '/onboarding/session',
          data: {},
          meta: { authRequired: false }
        }) as any;

        if (response?.data?.data?.sessionId) {
          setOnboardingSessionId(response.data.data.sessionId);
        }
      } catch (error) {
        console.error('세션 발급 실패:', error);
        // 세션 발급 실패해도 온보딩은 진행 가능하도록 함
      }
    };

    issueSession();
  }, [onboardingSessionId, setOnboardingSessionId]);

  // 먹BTI 완료 후
  const handleMukbtiDone = () => {
    setStep('bingo');
  };

  // 빙고 완료 후 - 통합 POST 요청
  const handleBingoDone = async (bingoResponses: Array<{ id: string; vote: number }>) => {
    try {
      const response = await customAxios({
        method: 'POST',
        url: '/onboarding/import',
        data: {
          mukbtiAnswers,
          bingoResponses,
        },
        meta: { authRequired: false }
      }) as any;

      const data = response.data;
      
      // 결과 저장
      setMukbtiResult(data.mukbtiResult);

      // 결과 페이지로 이동
      nav(`/onboarding/result?typeId=${data.typeId}`);
    } catch (error: any) {
      console.error('온보딩 결과 저장 오류:', error);
      const errorMessage = error.response?.data?.message || error.message || '결과 저장에 실패했습니다. 다시 시도해주세요.';
      alert(errorMessage);
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
