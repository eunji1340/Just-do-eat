import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopNavBar } from "@/widgets/top-navbar";

/**
 * 검색 시작 페이지
 * - 상단에 검색 네비바 표시
 * - 흰 배경 (향후 인기검색어/최근검색어 추가 예정)
 * - 검색어 입력 후 엔터 또는 검색 아이콘 클릭 시 검색 결과 페이지로 이동
 */
export default function SearchStartPage() {
  const navigate = useNavigate();
  // 검색어 상태
  const [searchQuery, setSearchQuery] = useState("");

  /**
   * 검색 실행 핸들러
   * - 검색어가 비어있지 않으면 검색 결과 페이지로 이동
   */
  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  /**
   * 뒤로가기 핸들러
   * - 이전 페이지로 이동
   */
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex justify-center bg-body">
      {/* 모바일 우선 레이아웃: 최소 320px, 최대 640px (sm 이상) */}
      <div className="w-full min-w-[320px] sm:max-w-[640px] bg-white shadow-sm">
        {/* 검색 네비바 */}
        <TopNavBar
          variant="search"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onSearch={handleSearch}
          onBack={handleBack}
        />

        {/* 메인 콘텐츠 영역 */}
        <div className="pt-16">
          {/* 향후 인기검색어, 최근검색어 영역 */}
          <div className="p-4">
            {/* TODO: 인기검색어 위젯 추가 */}
            {/* TODO: 최근검색어 위젯 추가 */}
          </div>
        </div>
      </div>
    </div>
  );
}
