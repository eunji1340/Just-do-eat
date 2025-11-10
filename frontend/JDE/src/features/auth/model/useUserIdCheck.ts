import { useState, useEffect } from 'react';
import customAxios from '@/shared/api/http';

export function useUserIdCheck(userId: string) {
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!userId || userId.length < 4) {
      setChecking(false);
      setAvailable(null);
      setMessage('');
      return;
    }

    const timer = setTimeout(() => {
      checkUserId(userId);
    }, 500);

    return () => clearTimeout(timer);
  }, [userId]);

  const checkUserId = async (userId: string) => {
    setChecking(true);
    setMessage('확인 중...');

    try {
      const response = await customAxios({
        method: 'GET',
        url: `/users/exists?userId=${encodeURIComponent(userId)}`,
        meta: { authRequired: false }
      }) as any;

      const exists = response?.data?.data ?? false;
      
      setAvailable(!exists);
      setMessage(exists ? '이미 사용 중인 아이디입니다.' : '사용 가능한 아이디입니다.');
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData?.code === 'NOT_FOUND' || error.response?.status === 404) {
        setAvailable(true);
        setMessage('사용 가능한 아이디입니다.');
      } else {
        setAvailable(null);
        setMessage('중복 확인에 실패했습니다.');
      }
    } finally {
      setChecking(false);
    }
  };

  return { checking, available, message };
}

