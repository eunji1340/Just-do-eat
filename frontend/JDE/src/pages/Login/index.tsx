import { useNavigate } from 'react-router-dom';
import AuthLayout from '@/widgets/auth/AuthLayout';
import LoginForm from '@/features/auth/ui/LoginForm';
import { useLogin } from '@/features/auth/model/useLogin';

export default function LoginPage() {
  const nav = useNavigate();
  const {
    formData,
    handleChange,
    submitting,
    error,
    handleSubmit: submit,
  } = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    const result = await submit(e);
    if (result) {
      alert('로그인 성공!');
      nav('/');
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
