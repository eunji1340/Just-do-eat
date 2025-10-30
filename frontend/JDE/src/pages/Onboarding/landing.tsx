// src/pages/Onboarding/landing.tsx
import { useNavigate } from 'react-router-dom';

export default function OnboardingLanding() {
  const nav = useNavigate();

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      gap: '32px',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      {/* 서비스 소개 */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>🍽️ 먹BTI</h1>
        <p style={{ fontSize: '18px', color: '#666', lineHeight: '1.6' }}>
          나만의 음식 취향을 발견하고<br />
          맞춤형 맛집을 추천받아보세요!
        </p>
      </div>

      {/* 버튼 그룹 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '400px' }}>
        <button
          onClick={() => nav('/login')}
          style={{
            padding: '16px 32px',
            fontSize: '18px',
            borderRadius: 12,
            border: 'none',
            background: '#222',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          로그인
        </button>

        <button
          onClick={() => nav('/signup')}
          style={{
            padding: '16px 32px',
            fontSize: '18px',
            borderRadius: 12,
            border: '2px solid #222',
            background: '#fff',
            color: '#222',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          회원가입
        </button>

        <button
          onClick={() => nav('/onboarding/test')}
          style={{
            padding: '16px 32px',
            fontSize: '16px',
            borderRadius: 12,
            border: '1px solid #ddd',
            background: '#f5f5f5',
            color: '#666',
            cursor: 'pointer'
          }}
        >
          비회원으로 테스트하기
        </button>
      </div>

      <p style={{ fontSize: '14px', color: '#999', textAlign: 'center' }}>
        비회원은 테스트만 가능하며,<br />
        결과 저장 및 맞춤 추천을 받으려면 회원가입이 필요합니다.
      </p>
    </div>
  );
}

