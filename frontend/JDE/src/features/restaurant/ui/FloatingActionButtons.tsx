// src/features/restaurant/ui/FloatingActionButtons.tsx
// 목적: 식당 상세 페이지 우하단 플로팅 버튼

import { Star, ChevronsUp } from "lucide-react";
import http from "@/shared/api/http";

interface FloatingActionButtonsProps {
  restaurantId: number;
  showBackToFeed?: boolean;
  isVisible?: boolean;
}

/**
 * 식당 상세 페이지 우하단 플로팅 버튼
 * - 즐겨찾기 버튼 (항상 표시)
 * - 피드로 돌아가기 버튼 (피드에서 진입한 경우에만 표시)
 */
export default function FloatingActionButtons({
  restaurantId,
  showBackToFeed = false,
  isVisible = true,
}: FloatingActionButtonsProps) {
  /**
   * 즐겨찾기 버튼 핸들러
   */
  const handleBookmark = async () => {
    // 로그인 체크
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    try {
      await http.post(`/restaurants/${restaurantId}/bookmark`);
      console.log(`✅ [북마크] 추가 성공 - restaurantId: ${restaurantId}`);
      alert("북마크에 추가되었습니다!");
    } catch (err) {
      console.error("[북마크] 추가 실패:", err);
      alert("북마크 추가에 실패했습니다.");
    }
  };

  /**
   * 피드로 돌아가기 핸들러
   */
  const handleBackToFeed = () => {
    window.history.back();
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex flex-col gap-3 transition-all duration-500 ease-out delay-100 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {/* 즐겨찾기 버튼 (항상 표시) */}
      <button
        onClick={handleBookmark}
        className="group flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-lg border border-neutral-300 transition-all duration-300 hover:bg-gradient-to-br hover:from-orange-400 hover:via-orange-500 hover:to-orange-700 hover:shadow-2xl hover:shadow-orange-500/70 hover:border-transparent hover:-translate-y-1 hover:scale-110 active:translate-y-1 active:scale-95 active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)]"
        aria-label="즐겨찾기"
      >
        <Star
          className="w-5 h-5 text-orange-500 group-hover:text-white transition-colors"
          strokeWidth={3}
        />
      </button>

      {/* 피드로 돌아가기 버튼 (피드에서 진입한 경우에만 표시) */}
      {showBackToFeed && (
        <button
          onClick={handleBackToFeed}
          className="group flex items-center justify-center w-9 h-9 rounded-full bg-white shadow-lg border border-neutral-300 transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-400 hover:via-blue-500 hover:to-blue-700 hover:shadow-2xl hover:shadow-blue-500/70 hover:border-transparent hover:-translate-y-1 hover:scale-110 active:translate-y-1 active:scale-95 active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)]"
          aria-label="피드로 돌아가기"
        >
          <ChevronsUp
            className="w-5 h-5 text-blue-500 group-hover:text-white transition-colors"
            strokeWidth={3}
          />
        </button>
      )}
    </div>
  );
}
