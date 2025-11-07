// src/pages/main/MainPage.tsx
// 목적: 메인(홈) 화면 레이아웃 구성 (단일 책임: 배치와 섹션 호출)

import { useNavigate } from "react-router-dom";
import { TopNavBar } from "@/widgets/top-navbar";
import { FeedbackBanner } from "@/widgets/feedback-banner";
import NearbyRankingSection from "../../widgets/ranking/NearbyRankingSection";
import PersonalizedEntryButton from "../../widgets/entry/PersonalizedEntryButton";

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

        {/* 주제별 추천 식당 2개 */}
        {/* 
        [{강남역} 주변 겨울철 인기 식당]
        [{강남역} 주변 데이트 맛집 추천]
        등등 여러개 추가 */}
        {/* h-20 */}

        {/* 강남역 인기 식당 Top 10 */}
        {/* 카드 옆으로 스크롤해서 확인 가능 */}
        {/* 카드
        ┌─────────────────────┐
        | (0등)               |
        | 이미지               |
        |                     |
        |                     |
        |                     |
        |                     |
        |                     |
        |_____________________|
        |식당이름              |
        |식당 주소             |
        └─────────────────────┘ */}

        <NearbyRankingSection />

        {/* 유형별 맛집 추천(예: 한식, 중식, 일식 등) */}
        {/* (한식이미지) (중식이미지) (일식 이미지)
        가로 스크롤로 추가 유형 볼 수 있음 */}
      </div>

      {/* 푸터내용은 마이>서비스 정보에 넣기 */}
    </>
  );
}
