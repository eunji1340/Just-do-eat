// =============================================
// src/pages/onboarding/result.tsx
// =============================================
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useUserStore } from '../../entities/user/model/user-store';
import customAxios from '../../shared/api/http';

type MukbtiMatchType = {
  type: string;
  label: string;
  imagePath: string;
};

type MukbtiResultDetail = {
  code: string;
  label: string;
  nickname: string;
  keywords: string[];
  description: string;
  goodMatch: MukbtiMatchType[];
  badMatch: MukbtiMatchType[];
  imagePath: string;
};

export default function OnboardingResultPage() {
  const { mukbtiResult } = useUserStore();
  const [searchParams] = useSearchParams();
  const [resultDetail, setResultDetail] = useState<MukbtiResultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  // 쿼리 파라미터에서 typeId 가져오기, 없으면 store의 mukbtiResult 사용
  const typeId = searchParams.get('typeId');
  const targetTypeId = typeId || mukbtiResult?.code;

  useEffect(() => {
    if (!targetTypeId) {
      setLoading(false);
      return;
    }

    // API에서 상세 결과 정보 가져오기
    customAxios({
      method: 'GET',
      url: `/onboarding/result/types/${targetTypeId}`,
      meta: { authRequired: false }
    })
      .then((response: any) => {
        setResultDetail(response.data);
        setLoading(false);
      })
      .catch((err: any) => {
        const errorMessage = err.response?.data?.message || err.message || '결과를 불러올 수 없습니다.';
        setError(errorMessage);
        setLoading(false);
      });
  }, [targetTypeId]);

  const handleShare = async () => {
    if (!targetTypeId || sharing) return;
    
    setSharing(true);
    try {
      await customAxios({
        method: 'POST',
        url: '/onboarding/share',
        data: { typeId: targetTypeId },
        meta: { authRequired: false }
      });
    } catch (err) {
      console.error('공유하기 요청 실패:', err);
    } finally {
      setSharing(false);
    }
  };

  if (!targetTypeId) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--color-bg)] py-4">
        <div className="grid gap-3 p-4 max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[var(--color-fg)]">결과가 아직 없습니다</h2>
          <p className="text-[var(--color-muted)]">온보딩을 먼저 진행해주세요.</p>
          <Link to="/onboarding" className="text-[var(--color-primary)] underline hover:opacity-80">
            온보딩으로 이동
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <p className="text-[var(--color-muted)]">결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !resultDetail) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--color-bg)] py-4">
        <div className="grid gap-3 p-4 max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[var(--color-fg)]">오류 발생</h2>
          <p className="text-[var(--color-muted)]">{error || '결과를 불러올 수 없습니다.'}</p>
          <Link to="/onboarding" className="text-[var(--color-primary)] underline hover:opacity-80">
            온보딩으로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] py-4">
      <div className="grid gap-4 p-4 max-w-xl w-full mx-auto">
        <h2 className="text-2xl font-bold text-center text-[var(--color-fg)]">당신의 먹BTI 유형은?</h2>
        
        {/* 유형 정보 */}
        <section className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-surface)] text-center">
          <h3 className="mt-0 mb-2 text-lg font-semibold text-[var(--color-fg)]">
            {resultDetail.label} ({resultDetail.code})
          </h3>
          {resultDetail.imagePath && (
            <div className="flex justify-center mb-3">
              <img 
                src={resultDetail.imagePath} 
                alt={resultDetail.label}
                className="max-w-[300px] max-h-[300px] w-auto h-auto object-contain rounded-lg"
              />
            </div>
          )}
          <p className="m-0 text-sm text-[var(--color-muted)] mb-3">{resultDetail.nickname}</p>
          <p className="m-0 text-[var(--color-fg)]">{resultDetail.description}</p>
        </section>

        {/* 키워드 */}
        {resultDetail.keywords && resultDetail.keywords.length > 0 && (
          <section className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-surface)] text-center">
            <h3 className="mt-0 mb-3 text-lg font-semibold text-[var(--color-fg)]">핵심 키워드</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {resultDetail.keywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-fg)] text-sm font-medium"
                >
                  #{keyword}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 잘 맞는 유형 / 안 맞는 유형 - 나란히 배치 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 잘 맞는 유형 */}
          {resultDetail.goodMatch && resultDetail.goodMatch.length > 0 && (
            <section className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-surface)] text-center">
              <h3 className="mt-0 mb-3 text-lg font-semibold text-[var(--color-fg)]">잘 맞는 유형</h3>
              <div className="flex flex-col gap-4 items-center">
                {resultDetail.goodMatch.map((match, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    {match.imagePath && (
                      <img 
                        src={match.imagePath} 
                        alt={match.label}
                        className="max-w-[120px] max-h-[120px] w-auto h-auto object-contain rounded-lg"
                      />
                    )}
                    <p className="text-sm font-medium text-[var(--color-fg)] m-0">
                      {match.label} ({match.type})
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 안 맞는 유형 */}
          {resultDetail.badMatch && resultDetail.badMatch.length > 0 && (
            <section className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-surface)] text-center">
              <h3 className="mt-0 mb-3 text-lg font-semibold text-[var(--color-fg)]">안 맞는 유형</h3>
              <div className="flex flex-col gap-4 items-center">
                {resultDetail.badMatch.map((match, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    
                    {match.imagePath && (
                      <img 
                        src={match.imagePath} 
                        alt={match.label}
                        className="max-w-[120px] max-h-[120px] w-auto h-auto object-contain rounded-lg"
                      />
                    )}
                    <p className="text-sm font-medium text-[var(--color-fg)] m-0">
                      {match.label} ({match.type})
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {/* 결과 공유하기 버튼 */}
          <button
            onClick={handleShare}
            disabled={sharing}
            className="px-4 py-3 rounded-xl border-2 border-[var(--color-primary)] bg-[var(--color-bg)] text-[var(--color-fg)] font-bold cursor-pointer hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
          >
            {sharing ? '공유 중...' : '결과 공유하기'}
          </button>

          {/* 이 결과로 회원가입하기 버튼 */}
          <Link
            to="/signup"
            className="block px-4 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-fg)] no-underline font-bold hover:opacity-90 transition-colors w-full text-center"
          >
            이 결과로 회원가입하기
          </Link>
        </div>
      </div>
    </div>
  );
}
