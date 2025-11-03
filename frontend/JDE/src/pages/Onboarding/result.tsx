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
      <div className="min-h-screen flex items-center justify-center">
        <div className="grid gap-3 p-4 max-w-md text-center">
          <h2 className="text-2xl font-bold">결과가 아직 없어요</h2>
          <p className="text-gray-600">온보딩을 먼저 진행해 주세요.</p>
          <Link to="/onboarding" className="text-blue-600 underline hover:text-blue-800">
            온보딩으로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="grid gap-4 p-4 max-w-2xl w-full">
        <h2 className="text-2xl font-bold text-center">먹BTI 결과</h2>
      <section className="border border-gray-200 rounded-xl p-4 text-center">
        <h3 className="mt-0 mb-2 text-lg font-semibold">
          {mukbtiResult.label} ({mukbtiResult.code})
        </h3>
        <p className="m-0 text-gray-700">{mukbtiResult.description}</p>
      </section>

      <section className="border border-gray-200 rounded-xl p-4 text-center">
        <h3 className="mt-0 mb-2 text-lg font-semibold">호불호 요약</h3>
        <ul className="m-0 pl-5 list-disc inline-block text-left">
          {bingoLikes?.filter(b => b.liked).map(b => (
            <li key={b.item}>✅ {b.item}</li>
          ))}
        </ul>
      </section>

      <section className="border border-gray-200 rounded-xl p-4 text-center">
        <h3 className="mt-0 mb-2 text-lg font-semibold">태그 선호도 (0~1)</h3>
        {Object.keys(tagPrefs).length === 0 ? (
          <p className="m-0 text-gray-500">계산된 태그 선호도가 없습니다.</p>
        ) : (
          <ul className="m-0 pl-5 list-disc inline-block text-left">
            {Object.entries(tagPrefs).sort((a,b)=>b[1]-a[1]).map(([tag, score]) => (
              <li key={tag}><code className="bg-gray-100 px-1 rounded">{tag}</code>: {score.toFixed(3)}</li>
            ))}
          </ul>
        )}
      </section>

        <div className="text-center">
          <Link
            to="/signup"
            className="inline-block px-4 py-3 rounded-xl bg-neutral-900 text-white no-underline hover:bg-neutral-800 transition-colors"
          >
            이 결과로 회원가입하기
          </Link>
        </div>
      </div>
    </div>
  );
}
