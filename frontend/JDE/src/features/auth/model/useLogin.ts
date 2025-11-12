import { useState } from 'react';
import type { AxiosError, AxiosResponse } from 'axios';
import customAxios from '@/shared/api/http';

export type LoginResult = {
  accessToken?: string;
  refreshToken?: string;
};

type LoginApiResult = {
  accessToken?: string;
  refreshToken?: string;
};

type LoginApiResponse = {
  status: string;
  message?: string;
  result?: LoginApiResult;
};

export function useLogin() {
  const [formData, setFormData] = useState({ name: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<LoginResult | null> => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await customAxios<AxiosResponse<LoginApiResponse>>({
        method: 'POST',
        url: '/auth/login',
        data: formData,
        meta: { authRequired: false }
      });

      const data = response.data;

      if (data.status !== 'OK') {
        throw new Error(data.message || '로그인에 실패했습니다.');
      }

      const result: LoginResult = {};

      if (data.result?.accessToken) {
        localStorage.setItem('accessToken', data.result.accessToken);
        result.accessToken = data.result.accessToken;
      }
      if (data.result?.refreshToken) {
        localStorage.setItem('refreshToken', data.result.refreshToken);
        result.refreshToken = data.result.refreshToken;
      }

      return result;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message ?? axiosError.message ?? '로그인 중 오류가 발생했습니다.';
      setError(errorMessage);
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return { formData, handleChange, submitting, error, handleSubmit };
}

