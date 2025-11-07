// src/widgets/entry/PersonalizedEntryButton.tsx
// 목적: 스와이프 페이지로 이동하는 CTA 버튼 (단일 책임)
// 교체 포인트: shared/ui/Button으로 교체, 추적 로그 hook 추가

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/shared/ui/shadcn/card";

export default function PersonalizedEntryButton() {
  return (
    // 개인추천피드 페이지로 변경하기
    <Link to="/swipe" className="block w-full">
      <Card className="mx-4 overflow-hidden shadow-md pb-0">
        {/* 상단: 이미지 + 텍스트 */}
        <CardContent className="p-4">
          <div className="flex items-center">
            {/* 캐릭터 이미지 */}
            <img
              src="/cute_man.png"
              alt="JDE 캐릭터"
              className="w-28 h-28 object-contain flex-shrink-0"
            />

            {/* 텍스트 영역 */}
            <div className="flex flex-col justify-center gap-1">
              <p className="text-sm font-large text-primary">
                고민은 그만, <br />
                먹으러 가자!
              </p>
              <h2 className="text-xl font-black text-neutral-950 mt-1">
                JUST DO EAT
              </h2>
            </div>
          </div>
        </CardContent>

        {/* 하단: 버튼 */}
        <CardFooter className="p-0 w-full">
          <div className="w-full bg-primary px-6 py-4 flex items-center justify-between hover:bg-s2 transition-colors rounded-b-xl">
            <span className="text-white font-semibold">
              내 취향의 식당 둘러보기
            </span>
            <ArrowRight className="w-6 h-6 text-white" strokeWidth={3} />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
