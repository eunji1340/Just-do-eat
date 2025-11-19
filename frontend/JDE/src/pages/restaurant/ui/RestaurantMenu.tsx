// src/pages/restaurant/ui/RestaurantMenu.tsx
// 목적: 식당 메뉴 섹션
import type { MenuInfo } from "../api/useRestaurantDetail";

interface RestaurantMenuProps {
  menu: MenuInfo[];
}

/**
 * 식당 메뉴 컴포넌트
 * - 메뉴 리스트
 * - 추천 메뉴, AI 추천 배지
 */
export default function RestaurantMenu({ menu }: RestaurantMenuProps) {
  if (!menu || menu.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-6 space-y-4">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-gray-900">메뉴</h2>
      </div>

      {/* 메뉴 리스트 */}
      <div className="space-y-2">
        {menu.map((menuItem, index) => (
          <div
            key={index}
            className="flex items-start justify-between gap-3 p-3 rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-gray-900">{menuItem.name}</p>
              </div>
            </div>
            <p className="font-semibold text-gray-900 flex-shrink-0">
              {menuItem.price.toLocaleString()}원
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
