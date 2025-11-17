import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../entities/user/model/user-store';
import AuthLayout from '@/widgets/auth/AuthLayout';
import SignupForm from '@/features/auth/ui/SignupForm';
import { useSignup } from '@/features/auth/model/useSignup';

export default function SignupPage() {
  const nav = useNavigate();
  const { mukbtiResult, resetOnboarding } = useUserStore();
  const [signupSuccess, setSignupSuccess] = React.useState(false);
  const {
    formData,
    previewUrl,
    handleChange,
    handleImageSelect,
    submitting,
    error,
    handleSubmit: submit,
    setNameCheckResult,
  } = useSignup();

  React.useEffect(() => {
    // 회원가입 성공 후에는 온보딩 체크를 하지 않음
    if (!mukbtiResult && !signupSuccess) {
      alert('온보딩을 먼저 완료해주세요.');
      nav('/onboarding/test');
    }
  }, [mukbtiResult, nav, signupSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    const success = await submit(e);
    if (success) {
      // 회원가입 성공 플래그 설정 (useEffect 리다이렉트 방지)
      setSignupSuccess(true);
      alert('회원가입이 완료되었습니다! 로그인해주세요.');
      // 먼저 페이지 이동
      nav('/login');
      // 페이지 이동 후 온보딩 정보 초기화
      setTimeout(() => {
        resetOnboarding();
      }, 0);
    }
  };

  // 회원가입 성공 후에는 체크하지 않음
  if (!mukbtiResult && !signupSuccess) {
    return null;
  }

  return (
    <AuthLayout
      title="회원가입"
      footer={
        <>
          이미 계정이 있으신가요?{' '}
          <a 
            href="/login" 
            onClick={(e) => { e.preventDefault(); nav('/login'); }}
            className="text-[var(--color-primary)] font-bold underline hover:opacity-80"
          >
            로그인하기
          </a>
        </>
      }
    >
      <SignupForm
        formData={formData}
        previewUrl={previewUrl}
        handleChange={handleChange}
        handleImageSelect={handleImageSelect}
        submitting={submitting}
        error={error}
        handleSubmit={handleSubmit}
        setNameCheckResult={setNameCheckResult}
      />
    </AuthLayout>
  );
}
