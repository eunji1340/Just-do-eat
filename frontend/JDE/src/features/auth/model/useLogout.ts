import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import customAxios from '@/shared/api/http';
import { useUserStore } from '@/entities/user/model/user-store';

export function useLogout() {
  const navigate = useNavigate();
  const { logout: clearStore } = useUserStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      // 서버에 로그아웃 요청
      await customAxios({
        method: 'POST',
        url: '/auth/logout',
      });
    } catch (error) {
      // 로그아웃 API 실패해도 클라이언트 정리는 진행
      console.error('로그아웃 API 호출 실패:', error);
    } finally {
      // 로컬스토리지에서 토큰 제거
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Zustand store 초기화
      clearStore();
      
      setIsLoggingOut(false);
      
      // 로그인 페이지로 이동
      navigate('/login');
    }
  };

  return { logout, isLoggingOut };
}

