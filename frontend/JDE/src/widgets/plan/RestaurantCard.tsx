import { useState } from "react";
import type { Restaurant } from "@/entities/plan/model/types";
import { cn } from "@/shared/lib/utils";

type RestaurantCardProps = {
  restaurant: Restaurant;
  highlight?: boolean;
  className?: string;
  showRadio?: boolean;
  isSelected?: boolean;
  onRadioClick?: () => void;
};

export function RestaurantCard({
  restaurant,
  highlight = false,
  className,
  showRadio = false,
  isSelected = false,
  onRadioClick,
}: RestaurantCardProps) {
  const { name, category, imageUrl, signatureMenus, likesCount } = restaurant;
  const menus = signatureMenus.slice(0, 2);
  const [imageError, setImageError] = useState(false);

  return (
    <article
      className={cn(
        "flex gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.06)]",
        highlight &&
          "border-primary/40 shadow-[0_8px_22px_rgba(249,115,22,0.18)]",
        className
      )}
    >
      {showRadio && (
        <div
          className="flex-shrink-0 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            onRadioClick?.();
          }}
        >
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer ${
              isSelected
                ? "border-primary bg-primary"
                : "border-gray-300 bg-white"
            }`}
          >
            {isSelected && (
              <div className="w-2.5 h-2.5 rounded-full bg-white" />
            )}
          </div>
        </div>
      )}
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={`${name} 대표 이미지`}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
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
          {menus.length > 0 ? (
            <div className="space-y-1.5">
              {menus.map((menu, index) => (
                <p key={index} className="mt-1 text-xs text-slate-500">
                  {menu}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-xs text-slate-500">
              대표 메뉴 정보가 없어요
            </p>
          )}
        </div>

        <div className="h-px w-full bg-slate-100" />

        <p className="ml-auto text-xs font-medium text-slate-400">
          {likesCount.toString().padStart(3, "0")}명이 즐겨찾는 집
        </p>
      </div>
    </article>
  );
}
