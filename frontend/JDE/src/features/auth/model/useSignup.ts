import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/entities/user/model/user-store';
import customAxios from '@/shared/api/http';

type AgeGroup = 'TEENS' | 'TWENTIES' | 'THIRTIES' | 'FORTIES' | 'FIFTIES_PLUS';
type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export function useSignup() {
  const nav = useNavigate();
  const { onboardingSessionId } = useUserStore();
  
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    passwordConfirm: '',
    imageUrl: null as string | null,
    ageGroup: 'TWENTIES' as AgeGroup,
    gender: 'MALE' as Gender,
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userIdCheck, setUserIdCheck] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ checking: false, available: null, message: '' });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'userId') {
      setUserIdCheck({ checking: false, available: null, message: '' });
    }
  };

  const setUserIdCheckResult = (result: { checking: boolean; available: boolean | null; message: string }) => {
    setUserIdCheck(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      setSubmitting(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      setSubmitting(false);
      return;
    }

    if (userIdCheck.available === false) {
      setError('사용할 수 없는 아이디입니다.');
      setSubmitting(false);
      return;
    }

    if (userIdCheck.checking) {
      setError('아이디 중복 확인 중입니다. 잠시 후 다시 시도해주세요.');
      setSubmitting(false);
      return;
    }

    try {
      const payload: {
        userId: string;
        password: string;
        imageUrl: string | null;
        ageGroup: string;
        gender: string;
        sessionId?: string;
      } = {
        userId: formData.userId,
        password: formData.password,
        imageUrl: formData.imageUrl,
        ageGroup: formData.ageGroup,
        gender: formData.gender,
      };

      if (onboardingSessionId) {
        payload.sessionId = onboardingSessionId;
      }

      const response = await customAxios({
        method: 'POST',
        url: '/auth/signup',
        data: payload,
        meta: { authRequired: false }
      }) as any;

      if (response?.data?.status === 'CREATED') {
        alert('회원가입이 완료되었습니다! 로그인해주세요.');
        nav('/login');
      } else {
        throw new Error(response?.data?.message || '회원가입에 실패했습니다.');
      }
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.message || '회원가입 중 오류가 발생했습니다.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    formData,
    handleChange,
    submitting,
    error,
    handleSubmit,
    userIdCheck,
    setUserIdCheckResult,
  };
}

