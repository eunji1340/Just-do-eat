import { useUserStore } from '@/entities/user/model/user-store';

export function OnboardingSummary() {
  const { mukbtiResult, bingoLikes, tagPrefs } = useUserStore();

  if (!mukbtiResult) return null;

  return (
    <section className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-surface)] text-center mt-5">
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
  );
}

