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
      <div className="bg-gradient-to-b from-gray-50 to-white md:py-10 space-y-6">
        {/* 현재 위치 정보  표시*/}

        {/* 최근 방문 식당 확인 배너 */}

        {/* 개인 추천 피드 진입 */}
        <section>
          <PersonalizedEntryButton />
        </section>

        {/* 주제별 추천 식당 리스트 */}

        {/* 근처 인기 식당 Top 10 */}
        <NearbyRankingSection />

        {/* 유형별 맛집 추천(예: 한식, 중식, 일식 등) */}
      </div>

      {/* 푸터 */}
      {/* 푸터내용은 마이>서비스 정보에 넣기 */}
      {/* <footer className="border-t mt-16">
          <div className="px-4 py-6 text-xs text-gray-500 text-center">
            © {new Date().getFullYear()} JUST DO EAT
          </div>
        </footer> */}
    </>
  );
}
