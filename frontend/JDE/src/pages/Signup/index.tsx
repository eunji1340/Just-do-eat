// =============================================
// src/pages/signup/index.tsx
// =============================================
import React from 'react';
import { useUserStore } from '../../entities/user/model/user-store';

export default function SignupPage() {
  const { mukbtiResult, bingoLikes, tagPrefs } = useUserStore();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        mukbti: mukbtiResult,                              // { code, label, description }
        likes: (bingoLikes || []).filter(b => b.liked).map(b => b.item),
        tag_prefs: tagPrefs,
        // TODO: 닉네임/이메일/비밀번호 등 폼 값을 추가
      };

      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`서버 오류(${res.status})`);
      setDone(true);
    } catch (e: any) {
      setError(e.message ?? '제출 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return <div>가입 완료! 🎉</div>;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2>회원가입</h2>

      <section style={{ border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>온보딩 결과 확인</h3>
        <p style={{ margin: 0 }}>
          <strong>먹BTI</strong>: {mukbtiResult ? `${mukbtiResult.label} (${mukbtiResult.code})` : '없음'}
        </p>
        <p style={{ margin: '8px 0 0' }}>
          <strong>선호</strong>: {(bingoLikes || []).filter(b=>b.liked).map(b=>b.item).join(', ') || '없음'}
        </p>
      </section>

      <section style={{ border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>태그 선호도</h3>
        {Object.keys(tagPrefs).length === 0 ? (
          <p style={{ margin: 0, color: '#666' }}>없음</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {Object.entries(tagPrefs).sort((a,b)=>b[1]-a[1]).map(([tag, score]) => (
              <li key={tag}><code>{tag}</code>: {score.toFixed(3)}</li>
            ))}
          </ul>
        )}
      </section>

      {/* TODO: 여기에 실제 입력 폼(닉네임/이메일/비밀번호 등)을 배치 */}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{ padding:'12px 16px', borderRadius:12, background: submitting ? '#888' : '#222', color:'#fff', border:0, cursor: submitting ? 'not-allowed' : 'pointer' }}
      >
        {submitting ? '제출 중…' : '가입 완료'}
      </button>

      {error && <div style={{ color: 'crimson' }}>{error}</div>}
    </div>
  );
}
