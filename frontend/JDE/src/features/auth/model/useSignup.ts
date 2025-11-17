import { useState, useCallback, useRef, useEffect } from 'react';
import { useUserStore } from '@/entities/user/model/user-store';
import customAxios from '@/shared/api/http';

type AgeGroup = 'TEENS' | 'TWENTIES' | 'THIRTIES' | 'FORTIES' | 'FIFTIES_PLUS';
type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export function useSignup() {
  const { onboardingSessionId } = useUserStore();
  
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    passwordConfirm: '',
    imageUrl: null as string | null,
    ageGroup: 'TWENTIES' as AgeGroup,
    gender: 'MALE' as Gender,
  });
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userIdCheck, setUserIdCheck] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ checking: false, available: null, message: '' });

  // previewUrl 변경 시 ref 동기화
  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'userId') {
      setUserIdCheck({ checking: false, available: null, message: '' });
    }
  };

  const setUserIdCheckResult = useCallback((result: { checking: boolean; available: boolean | null; message: string }) => {
    setUserIdCheck(result);
  }, []);

  const handleImageSelect = useCallback(async (file: File | null) => {
    // 이미지 제거
    if (file === null) {
      const currentPreviewUrl = previewUrlRef.current;
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
      setPreviewUrl(null);
      setFormData(prev => ({ ...prev, imageUrl: null }));
      return;
    }

    // 로컬 미리보기 세팅
    const blobUrl = URL.createObjectURL(file);
    setPreviewUrl(blobUrl);

    try {
      // 1. presigned URL 요청
      const presignResponse = await customAxios({
        method: 'POST',
        url: '/files/profile/presign',
        data: {
          fileName: file.name,
          contentType: file.type,
        },
        meta: { authRequired: false }
      }) as any;

      if (presignResponse?.data?.status !== 'OK' || !presignResponse?.data?.data) {
        throw new Error('Presigned URL 발급에 실패했습니다.');
      }

      const { uploadUrl, publicUrl, headers } = presignResponse.data.data;

      // 2. S3에 파일 업로드
      // 개발 환경(MSW 사용 시)에서는 실제 S3 업로드를 건너뛰고 publicUrl만 사용
      const isDevelopment = import.meta.env.DEV;
      
      if (!isDevelopment) {
        // 프로덕션 환경에서만 실제 S3 업로드
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
            ...(headers || {}),
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error('이미지 업로드에 실패했습니다.');
        }
      }

      // 3. 성공 시 publicUrl 저장
      setFormData(prev => ({ ...prev, imageUrl: publicUrl }));
      
      // previewUrl을 publicUrl로 치환 (선택사항)
      const currentPreviewUrl = previewUrlRef.current;
      if (currentPreviewUrl && currentPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
      setPreviewUrl(publicUrl);

    } catch (error: any) {
      console.error('이미지 업로드 오류:', error);
      
      // 에러 발생 시 상태 초기화
      const currentPreviewUrl = previewUrlRef.current;
      if (currentPreviewUrl && currentPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
      setPreviewUrl(null);
      setFormData(prev => ({ ...prev, imageUrl: null }));
      
      const errorMessage = error.response?.data?.message || error.message || '이미지 업로드에 실패했습니다.';
      alert(errorMessage);
    }
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

    if (userIdCheck.available === false) {
      setError('사용할 수 없는 아이디입니다.');
      setSubmitting(false);
      return false;
    }

    if (userIdCheck.checking) {
      setError('아이디 중복 확인 중입니다. 잠시 후 다시 시도해주세요.');
      setSubmitting(false);
      return false;
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
        return true;
      } else {
        throw new Error(response?.data?.message || '회원가입에 실패했습니다.');
      }
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.message || '회원가입 중 오류가 발생했습니다.';
      setError(errorMessage);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    formData,
    previewUrl,
    handleChange,
    handleImageSelect,
    submitting,
    error,
    handleSubmit,
    setUserIdCheckResult,
  };
}

