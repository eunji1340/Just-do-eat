// =============================================
// src/pages/signup/index.tsx
// =============================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../entities/user/model/user-store';

type AgeGroup = 'TEENS' | 'TWENTIES' | 'THIRTIES' | 'FORTIES' | 'FIFTIES_PLUS';
type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export default function SignupPage() {
  const nav = useNavigate();
  const { mukbtiResult, bingoLikes, tagPrefs } = useUserStore();
  
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

  // 온보딩 결과가 없으면 온보딩으로 리다이렉트
  React.useEffect(() => {
    if (!mukbtiResult) {
      alert('온보딩을 먼저 완료해주세요.');
      nav('/onboarding/test');
    }
  }, [mukbtiResult, nav]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

    try {
      // 세션 ID 생성 (온보딩 결과와 연결)
      const sessionId = crypto.randomUUID();

      const payload = {
        userId: formData.userId,
        password: formData.password,
        imageUrl: formData.imageUrl,
        ageGroup: formData.ageGroup,
        gender: formData.gender,
        sessionId,
      };

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || '회원가입에 실패했습니다.');
      }

      // 성공 시 로그인 페이지로 이동
      alert('회원가입이 완료되었습니다! 로그인해주세요.');
      nav('/login');
    } catch (e: any) {
      setError(e.message || '회원가입 중 오류가 발생했습니다.');
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
            className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
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
