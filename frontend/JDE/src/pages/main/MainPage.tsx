// src/pages/home/HomePage.tsx
// 목적: 메인(홈) 화면 레이아웃 구성 (단일 책임: 배치와 섹션 호출)
// 교체 포인트: Header/Footer → shared/ui 컴포넌트 교체, 섹션들 API 연동

import NearbyRankingSection from '../../widgets/ranking/NearbyRankingSection'
import PersonalizedEntryButton from '../../widgets/entry/PersonalizedEntryButton'

export default function MainPage() {
  return (
    
    <main className="min-h-dvh bg-gradient-to-b from-gray-50 to-white">
      {/* 교체 포인트: 공통 헤더 */}
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="font-bold tracking-tight">JUST DO EAT</h1>
            <nav className="text-sm text-gray-600">
              {/* 예비: 로그인 / 마이페이지 */}
              <button className="px-3 py-1.5 rounded-lg border hover:bg-gray-50">로그인</button>
            </nav>
          </div>
        </div>
      </header>

      {/* 콘텐츠 */}
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 space-y-6">
        {/* CTA: 스와이프 진입 */}
          <section className="flex flex-col items-center">
            <div className="w-full max-w-[600px]">
              <PersonalizedEntryButton />  {/* img: w-full h-auto block */}
              <button className="block w-full rounded-none border-t-0">
                지금 바로 추천받기 🍽️
              </button>
            </div>
          </section>

        {/* 근처 인기 식당 Top 10 */}
        <NearbyRankingSection />
      </div>

      {/* 교체 포인트: 공통 푸터 */}
      <footer className="border-t mt-16">
        <div className="max-w-5xl mx-auto px-4 py-6 text-xs text-gray-500">
          © {new Date().getFullYear()} JUST DO EAT
        </div>
      </footer>
    </main>
  )
}
