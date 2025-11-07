import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../entities/user/model/user-store';
import AuthLayout from '@/widgets/auth/AuthLayout';
import SignupForm from '@/features/auth/ui/SignupForm';
import { useSignup } from '@/features/auth/model/useSignup';

export default function SignupPage() {
  const nav = useNavigate();
  const { mukbtiResult } = useUserStore();
  const {
    formData,
    handleChange,
    submitting,
    error,
    handleSubmit: submit,
    setUserIdCheckResult,
  } = useSignup();

  React.useEffect(() => {
    if (!mukbtiResult) {
      alert('온보딩을 먼저 완료해주세요.');
      nav('/onboarding/test');
    }
  }, [mukbtiResult, nav]);

  const handleSubmit = async (e: React.FormEvent) => {
    const success = await submit(e);
    if (success) {
      alert('회원가입이 완료되었습니다! 로그인해주세요.');
      nav('/login');
    }
  };

  if (!mukbtiResult) {
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
        handleChange={handleChange}
        submitting={submitting}
        error={error}
        handleSubmit={handleSubmit}
        setUserIdCheckResult={setUserIdCheckResult}
      />
    </AuthLayout>
  );
}
