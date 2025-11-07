// src/pages/main/MainPage.tsx
// 목적: 메인(홈) 화면 레이아웃 구성 (단일 책임: 배치와 섹션 호출)

import { useNavigate } from "react-router-dom";
import { TopNavBar } from "@/widgets/top-navbar";
import { FeedbackBanner } from "@/widgets/feedback-banner";
import PersonalizedEntryButton from "../../widgets/entry/PersonalizedEntryButton";
import { RecommendationSection } from "@/widgets/recommendation-section/ui";

export default function MainPage() {
  const navigate = useNavigate();

  return (
    <>
      {/* 상단 네비바 */}
      <TopNavBar variant="default" onSearchClick={() => navigate("/search")} />

      {/* 메인 콘텐츠 */}
      <div className="md:py-10 space-y-6">
        {/* 추천받을 상권 선택 섹션, 왼쪽정렬 px-3,
        [<PinIcon>강남역 <아래다운츄버아이콘> */}

        {/* 최근 방문 식당 확인 배너 */}
        <FeedbackBanner />

        {/* 개인 추천 피드 진입 */}
        <PersonalizedEntryButton />

        {/* 다양한 타입의 추천 식당리스트 */}
        <RecommendationSection />
      </div>
    </>
  );
}
