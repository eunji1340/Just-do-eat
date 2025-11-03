// =============================================
// src/pages/Login/index.tsx
// =============================================
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const nav = useNavigate();
  
  const [formData, setFormData] = React.useState({
    userId: '',
    password: '',
  });
  
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || '로그인에 실패했습니다.');
      }

      // 토큰 저장 (localStorage 또는 secure cookie)
      localStorage.setItem('accessToken', data.result.accessToken);
      localStorage.setItem('refreshToken', data.result.refreshToken);

      // 성공 시 메인 페이지로 이동
      alert('로그인 성공!');
      nav('/'); // 또는 대시보드로 이동
    } catch (e: any) {
      setError(e.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md mx-auto p-5 grid gap-5 w-full">
        <div className="text-center mb-5">
          <h1 className="text-4xl m-0">🍽️</h1>
          <h2 className="mt-2 mb-0 text-2xl font-bold">로그인</h2>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* 아이디 */}
          <div className="grid gap-2">
            <label htmlFor="userId" className="font-bold text-sm">
              아이디
            </label>
            <input
              id="userId"
              type="text"
              value={formData.userId}
              onChange={(e) => handleChange('userId', e.target.value)}
              required
              placeholder="아이디를 입력하세요"
              className="p-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          {/* 비밀번호 */}
          <div className="grid gap-2">
            <label htmlFor="password" className="font-bold text-sm">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              required
              placeholder="비밀번호를 입력하세요"
              className="p-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={submitting}
            className={`
              p-4 rounded-xl text-white border-0 text-base font-bold transition-colors block mx-auto
              ${submitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-neutral-900 hover:bg-neutral-800 cursor-pointer'
              }
            `}
          >
            {submitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 테스트 계정 안내 */}
        <div className="p-3 rounded-lg bg-blue-50 text-xs text-gray-600">
          <strong>테스트 계정:</strong><br />
          아이디: demo_user_01<br />
          비밀번호: DemoPassw0rd!
        </div>

        {/* 회원가입 링크 */}
        <div className="text-center text-sm">
          계정이 없으신가요?{' '}
          <a 
            href="/onboarding/landing" 
            onClick={(e) => { e.preventDefault(); nav('/onboarding/landing'); }}
            className="text-neutral-900 font-bold underline hover:text-neutral-700"
          >
            온보딩 시작하기
          </a>
        </div>
      </div>
    </div>
  );
}
