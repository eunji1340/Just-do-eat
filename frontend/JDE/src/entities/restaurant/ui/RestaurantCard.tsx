import { useState } from "react";
import type { Restaurant } from "../types";
import NoImage from "/public/NOIMAGE.png";

// RestaurantCard Props 타입 정의
interface RestaurantCardProps {
  // 식당 정보
  restaurant: Restaurant;
  // "00이 즐겨찾는 집"의 00 부분 (선택적)
  favoriteBy?: string;
  // 카드 클릭 핸들러 (선택적)
  onClick?: () => void;
}

/**
 * 식당 정보를 카드 형식으로 표시하는 컴포넌트
 * @param restaurant - 식당 정보 객체
 * @param favoriteBy - 즐겨찾기 표시 (예: "홍길동")
 * @param onClick - 카드 클릭 시 호출될 함수
 */
export function RestaurantCard({
  restaurant,
  favoriteBy,
  onClick,
}: RestaurantCardProps) {
  // 대표 메뉴 2개 추출
  const topMenus = restaurant.menu.slice(0, 2);

  // 이미지 로드 실패 상태
  const [imageError, setImageError] = useState(false);

  // 이미지 체크
  const hasImage = restaurant.image && restaurant.image.length > 0;
  const imageUrl = hasImage ? restaurant.image[0] : null;

  return (
    <div
      className="flex gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* 왼쪽: 식당 이미지 */}
      <div className="w-[120px] h-[120px] rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
        {hasImage && imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
            onError={() => {
              console.error(`❌ 이미지 로드 실패: ${restaurant.name}`, imageUrl);
              setImageError(true);
            }}
            onLoad={() => {
              console.log(`✅ 이미지 로드 성공: ${restaurant.name}`);
            }}
          />
        ) : (
          // 이미지가 없거나 로드 실패 시 placeholder
          <div className="w-full h-full p-4 flex items-center justify-center bg-t3">
            <img src={NoImage} alt="" />
          </div>
        )}
      </div>

      {/* 오른쪽: 식당 정보 */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        {/* 상단 영역 */}
        <div className="space-y-1">
          {/* 카테고리 뱃지 */}
          <div>
            <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium">
              {restaurant.category}
            </span>
          </div>

          {/* 식당명 */}
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
            {restaurant.name}
          </h3>

          {/* 가격대 */}
          {restaurant.price_range && (
            <div className="text-sm">
              <span className="font-medium text-primary">
                {restaurant.price_range}
              </span>
            </div>
          )}

          {/* 대표 메뉴 목록 */}
          {topMenus.length > 0 && (
            <div className="space-y-0.5">
              {topMenus.map((menu, index) => (
                <p
                  key={index}
                  className="text-sm text-gray-600 line-clamp-1"
                >
                  {menu.name}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* 하단 영역: 즐겨찾기 정보 */}
        {favoriteBy && (
          <>
            <div className="border-t border-gray-200 my-2" />
            <p className="text-xs text-gray-500">
              {favoriteBy}이 즐겨찾는 집
            </p>
          </>
        )}
      </div>
    </div>
  );
}
