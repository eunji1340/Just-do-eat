import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import customAxios from '@/shared/api/http';

export function useLogin() {
  const nav = useNavigate();
  const [formData, setFormData] = useState({ userId: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await customAxios({
        method: 'POST',
        url: '/auth/login',
        data: formData,
        meta: { authRequired: false }
      }) as any;

      const data = response.data;

      if (data.status !== 'OK') {
        throw new Error(data.message || '로그인에 실패했습니다.');
      }

      if (data.result?.accessToken) {
        localStorage.setItem('accessToken', data.result.accessToken);
      }
      if (data.result?.refreshToken) {
        localStorage.setItem('refreshToken', data.result.refreshToken);
      }

      alert('로그인 성공!');
      nav('/');
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.message || '로그인 중 오류가 발생했습니다.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return { formData, handleChange, submitting, error, handleSubmit };
}

