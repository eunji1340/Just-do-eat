import { useNavigate } from 'react-router-dom';
import type { AxiosError, AxiosResponse } from 'axios';
import AuthLayout from '@/widgets/auth/AuthLayout';
import LoginForm from '@/features/auth/ui/LoginForm';
import { useLogin } from '@/features/auth/model/useLogin';
import { useUserStore } from '@/entities/user/model/user-store';
import customAxios from '@/shared/api/http';

type UserMeResponse = {
  status: string;
  code: string;
  message: string;
  data?: {
    userId: number;
    name: string;
    imageUrl: string;
    role: string;
    ageGroup: string;
    gender: string;
    createdAt: string;
    updatedAt: string;
    regionId: number | null;
    regionName: string | null;
  };
};

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
        const response = await customAxios<AxiosResponse<UserMeResponse>>({
          method: 'GET',
          url: '/users/me',
        });
        
        const userData = response.data?.data;

        if (!userData) {
          console.error('사용자 정보를 불러올 수 없습니다.');
          nav('/');
          return;
        }

        setUser({
          userId: userData.userId,
          name: userData.name,
          imageUrl: userData.imageUrl,
          ageGroup: userData.ageGroup,
          gender: userData.gender,
          role: userData.role,
        });
        nav('/');
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        console.error('사용자 정보 불러오기 실패:', axiosError);
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
