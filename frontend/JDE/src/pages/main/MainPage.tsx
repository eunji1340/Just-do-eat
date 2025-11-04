// src/pages/main/MainPage.tsx
// 목적: 메인(홈) 화면 레이아웃 구성 (단일 책임: 배치와 섹션 호출)

import { useNavigate } from "react-router-dom";
import { TopNavBar } from "@/widgets/top-navbar";
import NearbyRankingSection from "../../widgets/ranking/NearbyRankingSection";
import PersonalizedEntryButton from "../../widgets/entry/PersonalizedEntryButton";

export default function MainPage() {
  const navigate = useNavigate();

  return (
    <>
      {/* 상단 네비바 */}
      <TopNavBar variant="default" onSearchClick={() => navigate("/search")} />

      {/* 메인 콘텐츠 */}
      <div className="bg-gradient-to-b from-gray-50 to-white">
        <div className="px-4 py-6 md:py-10 space-y-6">
          {/* CTA: 개인 추천 진입 */}
          <section className="flex flex-col items-center">
            <div className="w-full">
              <PersonalizedEntryButton />
              <button className="block w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-b-lg transition-colors">
                지금 바로 추천받기 🍽️
              </button>
            </div>
          </section>

          {/* 근처 인기 식당 Top 10 */}
          <NearbyRankingSection />
        </div>

        {/* 푸터 */}
        <footer className="border-t mt-16">
          <div className="px-4 py-6 text-xs text-gray-500 text-center">
            © {new Date().getFullYear()} JUST DO EAT
          </div>
        </footer>
      </div>
    </>
  );
}
