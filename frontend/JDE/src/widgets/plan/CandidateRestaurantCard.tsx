import type { CandidateRestaurant } from "@/entities/plan/model/types";
import { cn } from "@/shared/lib/utils";

type CandidateRestaurantCardProps = {
  candidate: CandidateRestaurant;
  onClick?: () => void;
};

export function CandidateRestaurantCard({
  candidate,
  onClick,
}: CandidateRestaurantCardProps) {
  const { restaurant, menu } = candidate;
  
  // 대표 메뉴 2개 추출 (is_recommend 또는 is_ai_mate가 true인 것 우선)
  const recommendedMenus = menu.filter((m) => m.is_recommend || m.is_ai_mate);
  const displayMenus = recommendedMenus.length >= 2 
    ? recommendedMenus.slice(0, 2)
    : menu.slice(0, 2);

  return (
    <article
      onClick={onClick}
      className={cn(
        "flex gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.06)]",
        onClick && "cursor-pointer transition-shadow hover:shadow-[0_8px_22px_rgba(15,23,42,0.12)]"
      )}
    >
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {restaurant.image ? (
          <img
            src={restaurant.image}
            alt={`${restaurant.name} 대표 이미지`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
            이미지 없음
          </div>
        )}
        {/* 카테고리 배지 */}
        {(restaurant.category2 || restaurant.category1) && (
          <span className="absolute top-2 right-2 inline-flex items-center rounded-full bg-orange-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
            {restaurant.category2 || restaurant.category1}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            {restaurant.name}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {displayMenus.length > 0
              ? displayMenus.map((m) => m.name).join(" · ")
              : "대표 메뉴 정보가 없어요"}
          </p>
          {displayMenus.length === 1 && menu.length > 1 && (
            <p className="mt-0.5 text-xs text-slate-500">
              {menu[1]?.name || ""}
            </p>
          )}
        </div>

        <div className="h-px w-full bg-slate-100" />

        <p className="ml-auto text-xs font-medium text-slate-400">
          {(restaurant.kakao_review_cnt ?? 0).toString().padStart(3, "0")}명이 즐겨찾는 집
        </p>
      </div>
    </article>
  );
}

