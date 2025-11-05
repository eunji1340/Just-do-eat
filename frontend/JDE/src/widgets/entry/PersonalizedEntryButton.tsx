// src/widgets/entry/PersonalizedEntryButton.tsx
// 목적: 스와이프 페이지로 이동하는 CTA 버튼 (단일 책임)
// 교체 포인트: shared/ui/Button으로 교체, 추적 로그 hook 추가

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function PersonalizedEntryButton() {
  return (
    // 개인추천피드 페이지로 변경하기
    <Link to="/swipe" className="block w-full">
      <div className="bg-white overflow-hidden">
        {/* 상단: 이미지 + 텍스트 */}
        <div className="flex items-center p-6 gap-4">
          {/* 캐릭터 이미지 */}
          <img
            src="/cute_man.png"
            alt="JDE 캐릭터"
            className="w-32 h-32 object-contain flex-shrink-0"
          />

          {/* 텍스트 영역 */}
          <div className="flex flex-col justify-center gap-1">
            <p className="text-sm font-medium text-gray-900">
              식당 고를 때 걱정없이
            </p>
            <p className="text-sm font-medium text-gray-900">맛있게</p>
            <h2 className="text-xl font-bold text-gray-900 mt-1">
              JUST DO EAT
            </h2>
          </div>
        </div>

        {/* 하단: 버튼 */}
        <div className="bg-orange-400 px-6 py-4 flex items-center justify-between hover:bg-orange-500 transition-colors">
          <span className="text-white font-semibold">지금 추천받기</span>
          <ArrowRight className="w-6 h-6 text-white" strokeWidth={3} />
        </div>
      </div>
    </Link>
  );
}
