import type { Restaurant } from "@/entities/plan/model/types";
import { cn } from "@/shared/lib/utils";

type RestaurantCardProps = {
  restaurant: Restaurant;
  highlight?: boolean;
};

export function RestaurantCard({
  restaurant,
  highlight = false,
}: RestaurantCardProps) {
  const { name, category, imageUrl, signatureMenus, likesCount } = restaurant;
  const menus = signatureMenus.slice(0, 2);

  return (
    <article
      className={cn(
        "flex gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.06)]",
        highlight && "border-primary/40 shadow-[0_8px_22px_rgba(249,115,22,0.18)]"
      )}
    >
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${name} 대표 이미지`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
            이미지 없음
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <span className="inline-flex w-fit items-center rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-600">
          {category}
        </span>

        <div>
          <h3 className="text-base font-semibold text-slate-900">{name}</h3>
          <p className="mt-1 text-xs text-slate-500">
            {menus.length > 0 ? menus.join(" · ") : "대표 메뉴 정보가 없어요"}
          </p>
        </div>

        <div className="h-px w-full bg-slate-100" />

        <p className="ml-auto text-xs font-medium text-slate-400">
          {likesCount.toString().padStart(3, "0")}명이 즐겨찾는 집
        </p>
      </div>
    </article>
  );
}

