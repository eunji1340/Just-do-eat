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
    <div style={{ 
      maxWidth: '500px', 
      margin: '0 auto', 
      padding: '20px',
      display: 'grid',
      gap: '20px'
    }}>
      <h2 style={{ margin: 0 }}>회원가입</h2>

      {/* 온보딩 결과 요약 */}
      <section style={{ 
        border: '1px solid #eee', 
        borderRadius: 12, 
        padding: 16,
        background: '#f9f9f9'
      }}>
        <h3 style={{ marginTop: 0, fontSize: '16px' }}>온보딩 결과</h3>
        <p style={{ margin: '8px 0', fontSize: '14px' }}>
          <strong>먹BTI:</strong> {mukbtiResult.label} ({mukbtiResult.code})
        </p>
        <p style={{ margin: '8px 0', fontSize: '14px' }}>
          <strong>선호 항목:</strong> {(bingoLikes || []).filter(b=>b.liked).length}개
        </p>
        <p style={{ margin: '8px 0', fontSize: '14px' }}>
          <strong>태그 선호도:</strong> {Object.keys(tagPrefs).length}개
        </p>
      </section>

      {/* 회원가입 폼 */}
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
        {/* 아이디 */}
        <div style={{ display: 'grid', gap: '8px' }}>
          <label htmlFor="userId" style={{ fontWeight: 'bold', fontSize: '14px' }}>
            아이디 *
          </label>
          <input
            id="userId"
            type="text"
            value={formData.userId}
            onChange={(e) => handleChange('userId', e.target.value)}
            required
            placeholder="영문, 숫자 조합 (4-20자)"
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
            비밀번호 *
          </label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            required
            placeholder="8자 이상, 영문/숫자/특수문자 포함"
            style={{
              padding: '12px',
              borderRadius: 8,
              border: '1px solid #ddd',
              fontSize: '14px'
            }}
          />
        </div>

        {/* 비밀번호 확인 */}
        <div style={{ display: 'grid', gap: '8px' }}>
          <label htmlFor="passwordConfirm" style={{ fontWeight: 'bold', fontSize: '14px' }}>
            비밀번호 확인 *
          </label>
          <input
            id="passwordConfirm"
            type="password"
            value={formData.passwordConfirm}
            onChange={(e) => handleChange('passwordConfirm', e.target.value)}
            required
            placeholder="비밀번호 재입력"
            style={{
              padding: '12px',
              borderRadius: 8,
              border: '1px solid #ddd',
              fontSize: '14px'
            }}
          />
        </div>

        {/* 연령대 */}
        <div style={{ display: 'grid', gap: '8px' }}>
          <label htmlFor="ageGroup" style={{ fontWeight: 'bold', fontSize: '14px' }}>
            연령대 *
          </label>
          <select
            id="ageGroup"
            value={formData.ageGroup}
            onChange={(e) => handleChange('ageGroup', e.target.value)}
            style={{
              padding: '12px',
              borderRadius: 8,
              border: '1px solid #ddd',
              fontSize: '14px'
            }}
          >
            <option value="TEENS">10대</option>
            <option value="TWENTIES">20대</option>
            <option value="THIRTIES">30대</option>
            <option value="FORTIES">40대</option>
            <option value="FIFTIES_PLUS">50대 이상</option>
          </select>
        </div>

        {/* 성별 */}
        <div style={{ display: 'grid', gap: '8px' }}>
          <label style={{ fontWeight: 'bold', fontSize: '14px' }}>성별 *</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            {(['MALE', 'FEMALE', 'OTHER'] as const).map((gender) => (
              <label key={gender} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="gender"
                  value={gender}
                  checked={formData.gender === gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                />
                <span style={{ fontSize: '14px' }}>
                  {gender === 'MALE' ? '남성' : gender === 'FEMALE' ? '여성' : '기타'}
                </span>
              </label>
            ))}
          </div>
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
          {submitting ? '가입 중...' : '회원가입'}
        </button>
      </form>

      {/* 로그인 링크 */}
      <div style={{ textAlign: 'center', fontSize: '14px' }}>
        이미 계정이 있으신가요?{' '}
        <a 
          href="/login" 
          onClick={(e) => { e.preventDefault(); nav('/login'); }}
          style={{ color: '#222', fontWeight: 'bold', textDecoration: 'underline' }}
        >
          로그인하기
        </a>
      </div>
    </div>
  );
}
