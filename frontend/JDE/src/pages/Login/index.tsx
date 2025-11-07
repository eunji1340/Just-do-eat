import { useNavigate } from 'react-router-dom';
import AuthLayout from '@/widgets/auth/AuthLayout';
import LoginForm from '@/features/auth/ui/LoginForm';
import { useLogin } from '@/features/auth/model/useLogin';
import { useUserStore } from '@/entities/user/model/user-store';
import customAxios from '@/shared/api/http';

export default function LoginPage() {
  const nav = useNavigate();
  const { setUser } = useUserStore();
  const {
    formData,
    handleChange,
    submitting,
    error,
    handleSubmit: submit,
  } = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    const result = await submit(e);
    if (result && result.accessToken) {
      // 로그인 성공 후 사용자 정보 불러오기
      try {
        const response = await customAxios({
          method: 'GET',
          url: '/users/me',
        }) as any;
        
        if (response.data?.result) {
          setUser(response.data.result);
          nav('/');
        } else {
          console.error('사용자 정보를 불러올 수 없습니다.');
          nav('/');
        }
      } catch (error) {
        console.error('사용자 정보 불러오기 실패:', error);
        // 실패해도 메인 페이지로 이동
        nav('/');
      }
    }
  };

  return (
    <AuthLayout
      title="로그인"
      footer={
        <>
          계정이 없으신가요?{' '}
          <a
            href="/onboarding/landing"
            onClick={(e) => { e.preventDefault(); nav('/onboarding/landing'); }}
            className="text-[var(--color-primary)] font-bold underline hover:opacity-80"
          >
            테스트 시작하기
          </a>
        </>
      }
    >
      <LoginForm
        formData={formData}
        handleChange={handleChange}
        submitting={submitting}
        error={error}
        handleSubmit={handleSubmit}
      />
    </AuthLayout>
  );
}
