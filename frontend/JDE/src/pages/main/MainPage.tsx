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
        {/* 현재 위치 정보  표시, 왼쪽정렬 px-3
        [<PinIcon>강남역 <아래다운츄버아이콘> */}

        {/* 최근 방문 식당 확인 배너 */}
        {/* 
        [📍 식당 이름                    남은 질문 N]
        [    질문                                 ]
        [버튼                                     ]*/}
        {/* "전에 선택하신 식당이에요. 방문하셨나요??" 질문
            ├─ 예 → "방문하셨군요! 어땠어요?" (별로, 괜찮, 정말 좋았)
            └─ 아니오 → "아직 방문 전이시군요. 나중에 가실 계획이 있으신가요?"
                    ├─ 예 → 하루 뒤 배너에 재등장
                    └─ 아니오 → 배너 제거 
          결정한 식당*/}

        {/* 개인 추천 피드 진입 */}
        <section>
          <PersonalizedEntryButton />
        </section>

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
        가로 스크롤로 유형확인 */}
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
