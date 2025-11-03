// =============================================
// src/pages/onboarding/result.tsx
// =============================================
import { Link } from 'react-router-dom';
import { useUserStore } from '../../entities/user/model/user-store';

export default function OnboardingResultPage() {
  const { mukbtiResult, bingoLikes, tagPrefs } = useUserStore();

  if (!mukbtiResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="grid gap-3 p-4 max-w-md text-center">
          <h2 className="text-2xl font-bold text-[var(--color-fg)]">결과가 아직 없어요</h2>
          <p className="text-[var(--color-muted)]">온보딩을 먼저 진행해 주세요.</p>
          <Link to="/onboarding" className="text-[var(--color-primary)] underline hover:opacity-80">
            온보딩으로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="grid gap-4 p-4 max-w-2xl w-full">
        <h2 className="text-2xl font-bold text-center text-[var(--color-fg)]">먹BTI 결과</h2>
      <section className="border border-[var(--color-border)] rounded-xl p-4 text-center bg-[var(--color-surface)]">
        <h3 className="mt-0 mb-2 text-lg font-semibold text-[var(--color-fg)]">
          {mukbtiResult.label} ({mukbtiResult.code})
        </h3>
        <p className="m-0 text-[var(--color-fg)]">{mukbtiResult.description}</p>
      </section>

      <section className="border border-[var(--color-border)] rounded-xl p-4 text-center bg-[var(--color-surface)]">
        <h3 className="mt-0 mb-2 text-lg font-semibold text-[var(--color-fg)]">호불호 요약</h3>
        <ul className="m-0 pl-5 list-disc inline-block text-left text-[var(--color-fg)]">
          {bingoLikes?.filter(b => b.liked).map(b => (
            <li key={b.item}>✅ {b.item}</li>
          ))}
        </ul>
      </section>

      <section className="border border-[var(--color-border)] rounded-xl p-4 text-center bg-[var(--color-surface)]">
        <h3 className="mt-0 mb-2 text-lg font-semibold text-[var(--color-fg)]">태그 선호도 (0~1)</h3>
        {Object.keys(tagPrefs).length === 0 ? (
          <p className="m-0 text-[var(--color-muted)]">계산된 태그 선호도가 없습니다.</p>
        ) : (
          <ul className="m-0 pl-5 list-disc inline-block text-left text-[var(--color-fg)]">
            {Object.entries(tagPrefs).sort((a,b)=>b[1]-a[1]).map(([tag, score]) => (
              <li key={tag}><code className="bg-[var(--color-surface)] px-1 rounded">{tag}</code>: {score.toFixed(3)}</li>
            ))}
          </ul>
        )}
      </section>

        <div className="text-center">
          <Link
            to="/signup"
            className="block px-4 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-fg)] no-underline hover:opacity-90 transition-colors w-full"
          >
            이 결과로 회원가입하기
          </Link>
        </div>
      </div>
    </div>
  );
}
