// =============================================
// src/pages/signup/index.tsx
// =============================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../entities/user/model/user-store';
import customAxios from '../../shared/api/http';

type AgeGroup = 'TEENS' | 'TWENTIES' | 'THIRTIES' | 'FORTIES' | 'FIFTIES_PLUS';
type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export default function SignupPage() {
  const nav = useNavigate();
  const { mukbtiResult, bingoLikes, tagPrefs, onboardingSessionId } = useUserStore();
  
  // 폼 상태
  const [formData, setFormData] = React.useState({
    userId: '',
    password: '',
    passwordConfirm: '',
    imageUrl: null as string | null,
    ageGroup: 'TWENTIES' as AgeGroup,
    gender: 'MALE' as Gender,
  });
  
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  // 아이디 중복 확인 상태
  const [userIdCheck, setUserIdCheck] = React.useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ checking: false, available: null, message: '' });

  // 온보딩 결과가 없으면 온보딩으로 리다이렉트
  React.useEffect(() => {
    if (!mukbtiResult) {
      alert('온보딩을 먼저 완료해주세요.');
      nav('/onboarding/test');
    }
  }, [mukbtiResult, nav]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 아이디 변경 시 중복 확인 초기화
    if (field === 'userId') {
      setUserIdCheck({ checking: false, available: null, message: '' });
    }
  };

  // 아이디 중복 확인 함수
  const checkUserId = async (userId: string) => {
    if (!userId || userId.length < 4) {
      setUserIdCheck({ checking: false, available: null, message: '' });
      return;
    }

    setUserIdCheck({ checking: true, available: null, message: '확인 중...' });

    try {
      const response = await customAxios({
        method: 'GET',
        url: `/users/exists?userId=${encodeURIComponent(userId)}`,
        meta: { authRequired: false }
      }) as any;

      // 응답에서 boolean 값 직접 추출
      // response.data.data가 boolean 값 (true = 중복됨, false = 사용 가능)
      const exists = response?.data?.data ?? false;
      
      setUserIdCheck({
        checking: false,
        available: !exists,  // exists가 false면 사용 가능 (available = true)
        message: exists ? '이미 사용 중인 아이디입니다.' : '사용 가능한 아이디입니다.'
      });
    } catch (error: any) {
      // 404나 다른 에러는 사용 가능한 것으로 처리할 수도 있음
      const errorData = error.response?.data;
      if (errorData?.code === 'NOT_FOUND' || error.response?.status === 404) {
        setUserIdCheck({
          checking: false,
          available: true,
          message: '사용 가능한 아이디입니다.'
        });
      } else {
        setUserIdCheck({
          checking: false,
          available: null,
          message: '중복 확인에 실패했습니다.'
        });
      }
    }
  };

  // 아이디 입력에 debounce 적용
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.userId) {
        checkUserId(formData.userId);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // 유효성 검사
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

    // 아이디 중복 확인
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
      // 세션 ID가 있으면 포함하여 요청
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

      // 온보딩 세션이 있으면 포함
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
        // 성공 시 로그인 페이지로 이동
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

  if (!mukbtiResult) {
    return null; // useEffect에서 리다이렉트 처리
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="max-w-xl mx-auto p-5 grid gap-5 w-full">
        <h2 className="m-0 text-2xl font-bold text-center text-[var(--color-fg)]">회원가입</h2>

      {/* 온보딩 결과 요약 */}
      <section className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-surface)] text-center">
        <h3 className="mt-0 mb-2 text-base font-semibold text-[var(--color-fg)]">온보딩 결과</h3>
        <p className="my-2 text-sm text-[var(--color-fg)]">
          <strong>먹BTI:</strong> {mukbtiResult.label} ({mukbtiResult.code})
        </p>
        <p className="my-2 text-sm text-[var(--color-fg)]">
          <strong>선호 항목:</strong> {(bingoLikes || []).filter(b=>b.liked).length}개
        </p>
        <p className="my-2 text-sm text-[var(--color-fg)]">
          <strong>태그 선호도:</strong> {Object.keys(tagPrefs).length}개
        </p>
      </section>

      {/* 회원가입 폼 */}
      <form onSubmit={handleSubmit} className="grid gap-4">
        {/* 아이디 */}
        <div className="grid gap-2">
          <label htmlFor="userId" className="font-bold text-sm text-[var(--color-fg)]">
            아이디 *
          </label>
          <input
            id="userId"
            type="text"
            value={formData.userId}
            onChange={(e) => handleChange('userId', e.target.value)}
            required
            placeholder="영문, 숫자 조합 (4-20자)"
            className={`p-3 rounded-lg border ${
              userIdCheck.available === false 
                ? 'border-[var(--color-error)]' 
                : userIdCheck.available === true 
                ? 'border-green-500' 
                : 'border-[var(--color-border)]'
            } bg-[var(--color-bg)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]`}
          />
          {/* 아이디 중복 확인 결과 표시 */}
          {userIdCheck.checking && (
            <p className="text-sm text-[var(--color-muted)] m-0">확인 중...</p>
          )}
          {userIdCheck.available === false && (
            <p className="text-sm text-[var(--color-error)] m-0">{userIdCheck.message}</p>
          )}
          {userIdCheck.available === true && (
            <p className="text-sm text-green-600 m-0">{userIdCheck.message}</p>
          )}
        </div>

        {/* 비밀번호 */}
        <div className="grid gap-2">
          <label htmlFor="password" className="font-bold text-sm text-[var(--color-fg)]">
            비밀번호 *
          </label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            required
            placeholder="8자 이상, 영문/숫자/특수문자 포함"
            className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        {/* 비밀번호 확인 */}
        <div className="grid gap-2">
          <label htmlFor="passwordConfirm" className="font-bold text-sm text-[var(--color-fg)]">
            비밀번호 확인 *
          </label>
          <input
            id="passwordConfirm"
            type="password"
            value={formData.passwordConfirm}
            onChange={(e) => handleChange('passwordConfirm', e.target.value)}
            required
            placeholder="비밀번호 재입력"
            className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        {/* 연령대 */}
        <div className="grid gap-2">
          <label htmlFor="ageGroup" className="font-bold text-sm text-[var(--color-fg)]">
            연령대 *
          </label>
          <select
            id="ageGroup"
            value={formData.ageGroup}
            onChange={(e) => handleChange('ageGroup', e.target.value)}
            className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="TEENS">10대</option>
            <option value="TWENTIES">20대</option>
            <option value="THIRTIES">30대</option>
            <option value="FORTIES">40대</option>
            <option value="FIFTIES_PLUS">50대 이상</option>
          </select>
        </div>

        {/* 성별 */}
        <div className="grid gap-2">
          <label className="font-bold text-sm text-[var(--color-fg)]">성별 *</label>
          <div className="flex gap-3 justify-center">
            {(['MALE', 'FEMALE', 'OTHER'] as const).map((gender) => (
              <label key={gender} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value={gender}
                  checked={formData.gender === gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="cursor-pointer"
                />
                <span className="text-sm text-[var(--color-fg)]">
                  {gender === 'MALE' ? '남성' : gender === 'FEMALE' ? '여성' : '기타'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="p-3 rounded-lg bg-[var(--color-error)]/10 text-[var(--color-error)] text-sm">
            {error}
          </div>
        )}

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={submitting}
          className={`
            p-4 rounded-xl border-0 text-base font-bold transition-colors w-full
            ${submitting 
              ? 'bg-gray-400 cursor-not-allowed text-white' 
              : 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] hover:opacity-90 cursor-pointer'
            }
          `}
        >
          {submitting ? '가입 중...' : '회원가입'}
        </button>
      </form>

      {/* 로그인 링크 */}
      <div className="text-center text-sm text-[var(--color-muted)]">
        이미 계정이 있으신가요?{' '}
        <a 
          href="/login" 
          onClick={(e) => { e.preventDefault(); nav('/login'); }}
          className="text-[var(--color-primary)] font-bold underline hover:opacity-80"
        >
          로그인하기
        </a>
      </div>
      </div>
    </div>
  );
}
