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
    <div style={{ 
      maxWidth: '400px', 
      margin: '0 auto', 
      padding: '20px',
      display: 'grid',
      gap: '20px',
      minHeight: '100vh',
      alignContent: 'center'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '32px', margin: 0 }}>🍽️</h1>
        <h2 style={{ margin: '8px 0 0' }}>로그인</h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
        {/* 아이디 */}
        <div style={{ display: 'grid', gap: '8px' }}>
          <label htmlFor="userId" style={{ fontWeight: 'bold', fontSize: '14px' }}>
            아이디
          </label>
          <input
            id="userId"
            type="text"
            value={formData.userId}
            onChange={(e) => handleChange('userId', e.target.value)}
            required
            placeholder="아이디를 입력하세요"
            style={{
              padding: '12px',
              borderRadius: 8,
              border: '1px solid #ddd',
              fontSize: '14px'
            }}
          />
        </div>

        {/* 비밀번호 */}
        <div style={{ display: 'grid', gap: '8px' }}>
          <label htmlFor="password" style={{ fontWeight: 'bold', fontSize: '14px' }}>
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            required
            placeholder="비밀번호를 입력하세요"
            style={{
              padding: '12px',
              borderRadius: 8,
              border: '1px solid #ddd',
              fontSize: '14px'
            }}
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div style={{ 
            padding: '12px', 
            borderRadius: 8, 
            background: '#fee', 
            color: '#c00',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '16px',
            borderRadius: 12,
            background: submitting ? '#999' : '#222',
            color: '#fff',
            border: 0,
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {submitting ? '로그인 중...' : '로그인'}
        </button>
      </form>

      {/* 테스트 계정 안내 */}
      <div style={{ 
        padding: '12px', 
        borderRadius: 8, 
        background: '#f0f8ff',
        fontSize: '13px',
        color: '#666'
      }}>
        <strong>테스트 계정:</strong><br />
        아이디: demo_user_01<br />
        비밀번호: DemoPassw0rd!
      </div>

      {/* 회원가입 링크 */}
      <div style={{ textAlign: 'center', fontSize: '14px' }}>
        계정이 없으신가요?{' '}
        <a 
          href="/onboarding/landing" 
          onClick={(e) => { e.preventDefault(); nav('/onboarding/landing'); }}
          style={{ color: '#222', fontWeight: 'bold', textDecoration: 'underline' }}
        >
          온보딩 시작하기
        </a>
      </div>
    </div>
  );
}

