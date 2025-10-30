// =============================================
// src/pages/onboarding/result.tsx
// =============================================
import React from 'react';
import { Link } from 'react-router-dom';
import { useUserStore } from '../../entities/user/model/user-store';

export default function OnboardingResultPage() {
  const { mukbtiResult, bingoLikes, tagPrefs } = useUserStore();

  if (!mukbtiResult) {
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <h2>결과가 아직 없어요</h2>
        <p>온보딩을 먼저 진행해 주세요.</p>
        <Link to="/onboarding">온보딩으로 이동</Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2>먹BTI 결과</h2>
      <section style={{ border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>
          {mukbtiResult.label} ({mukbtiResult.code})
        </h3>
        <p style={{ margin: 0 }}>{mukbtiResult.description}</p>
      </section>

      <section style={{ border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>호불호 요약</h3>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {bingoLikes?.filter(b => b.liked).map(b => (
            <li key={b.item}>✅ {b.item}</li>
          ))}
        </ul>
      </section>

      <section style={{ border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>태그 선호도 (0~1)</h3>
        {Object.keys(tagPrefs).length === 0 ? (
          <p style={{ margin: 0, color: '#666' }}>계산된 태그 선호도가 없습니다.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {Object.entries(tagPrefs).sort((a,b)=>b[1]-a[1]).map(([tag, score]) => (
              <li key={tag}><code>{tag}</code>: {score.toFixed(3)}</li>
            ))}
          </ul>
        )}
      </section>

      <div>
        <Link
          to="/signup"
          style={{
            display: 'inline-block',
            padding: '12px 16px',
            borderRadius: 12,
            background: '#222',
            color: '#fff',
            textDecoration: 'none',
          }}
        >
          이 결과로 회원가입하기
        </Link>
      </div>
    </div>
  );
}
