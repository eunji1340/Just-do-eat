import { useState, useCallback } from 'react';
import type { AxiosError, AxiosResponse } from 'axios';
import { useUserStore } from '@/entities/user/model/user-store';
import customAxios from '@/shared/api/http';

type AgeGroup = 'TEENS' | 'TWENTIES' | 'THIRTIES' | 'FORTIES' | 'FIFTIES_PLUS';
type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export function useSignup() {
  const { onboardingSessionId } = useUserStore();
  
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    passwordConfirm: '',
    imageUrl: null as string | null,
    ageGroup: 'TWENTIES' as AgeGroup,
    gender: 'MALE' as Gender,
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameCheck, setNameCheck] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ checking: false, available: null, message: '' });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'name') {
      setNameCheck({ checking: false, available: null, message: '' });
    }
  };

  const setNameCheckResult = useCallback((result: { checking: boolean; available: boolean | null; message: string }) => {
    setNameCheck(result);
  }, []);

  const handleSubmit = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      setSubmitting(false);
      return false;
    }

    if (formData.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      setSubmitting(false);
      return false;
    }

    if (nameCheck.available === false) {
      setError('사용할 수 없는 아이디입니다.');
      setSubmitting(false);
      return false;
    }

    if (nameCheck.checking) {
      setError('아이디 중복 확인 중입니다. 잠시 후 다시 시도해주세요.');
      setSubmitting(false);
      return false;
    }

    try {
      const payload: {
        name: string;
        password: string;
        imageUrl: string | null;
        ageGroup: string;
        gender: string;
        sessionId?: string;
      } = {
        name: formData.name,
        password: formData.password,
        imageUrl: formData.imageUrl,
        ageGroup: formData.ageGroup,
        gender: formData.gender,
      };

      if (onboardingSessionId) {
        payload.sessionId = onboardingSessionId;
      }

      const response = await customAxios<AxiosResponse<{ status: string; message?: string }>>({
        method: 'POST',
        url: '/auth/signup',
        data: payload,
        meta: { authRequired: false }
      });

      if (response?.data?.status === 'CREATED') {
        return true;
      } else {
        throw new Error(response?.data?.message || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message ?? axiosError.message ?? '회원가입 중 오류가 발생했습니다.';
      setError(errorMessage);
      return false;
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
    setNameCheckResult,
  };
}

