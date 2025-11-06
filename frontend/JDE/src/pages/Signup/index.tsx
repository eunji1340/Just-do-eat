import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../entities/user/model/user-store';
import AuthLayout from '@/widgets/auth/AuthLayout';
import SignupForm from '@/features/auth/ui/SignupForm';

export default function SignupPage() {
  const nav = useNavigate();
  const { mukbtiResult } = useUserStore();

  React.useEffect(() => {
    if (!mukbtiResult) {
      alert('온보딩을 먼저 완료해주세요.');
      nav('/onboarding/test');
    }
  }, [mukbtiResult, nav]);

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
      <SignupForm />
    </AuthLayout>
  );
}
