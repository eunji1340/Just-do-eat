// src/pages/main/MainPage.tsx
// 목적: 메인(홈) 화면 레이아웃 구성 (단일 책임: 배치와 섹션 호출)

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopNavBar } from "@/widgets/top-navbar";
import { LocationSelector } from "@/widgets/location-selector";
import { FeedbackBanner } from "@/widgets/feedback-banner";
import PersonalizedEntryButton from "../../widgets/entry/PersonalizedEntryButton";
import { RecommendationSection } from "@/widgets/recommendation-section/ui";
import { DistrictSelectorModal } from "@/features/district-selector";
import type { District } from "@/entities/district";
import { popularDistricts } from "@/entities/district";

export default function MainPage() {
  const navigate = useNavigate();

  // 상권 선택 상태
  const [selectedDistrict, setSelectedDistrict] = useState<District>(
    popularDistricts[0] // 기본값: 역삼역
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* 상단 네비바 */}
      <TopNavBar variant="default" onSearchClick={() => navigate("/search")} />

      {/* 메인 콘텐츠 */}
      <div className="md:py-10 space-y-4">
        {/* 상권 선택 섹션 */}
        <div className="flex justify-center px-3">
          <LocationSelector
            location={selectedDistrict.name}
            onClick={() => setIsModalOpen(true)}
          />
        </div>

        {/* 최근 방문 식당 확인 배너 */}
        <FeedbackBanner />

        {/* 개인 추천 피드 진입 */}
        <PersonalizedEntryButton />

        {/* 다양한 타입의 추천 식당리스트 */}
        <RecommendationSection districtName={selectedDistrict.name} />
      </div>

      {/* 상권 선택 모달 */}
      <DistrictSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDistrictId={selectedDistrict.id}
        onSelect={setSelectedDistrict}
      />
    </>
  );
}
