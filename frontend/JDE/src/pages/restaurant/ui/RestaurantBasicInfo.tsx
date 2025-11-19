// src/pages/restaurant/ui/RestaurantBasicInfo.tsx
// 목적: 식당 기본 정보 (영업시간, 가격대, 주소, 전화번호)

import { useState } from "react";
import {
  Clock,
  DollarSign,
  MapPin,
  Phone,
  ChevronDown,
  ChevronUp,
  Copy,
} from "lucide-react";
import type {
  RestaurantDetailResponse,
  HoursInfo,
} from "../api/useRestaurantDetail";

/**
 * 가격대를 표시 문자열로 변환
 */
function formatPriceRange(priceRange: string): string {
  const map: Record<string, string> = {
    LOW: "~1만원",
    MEDIUM: "1~3만원대",
    HIGH: "3~6만원",
    PREMIUM: "6만원~",
  };
  return map[priceRange] || "₩₩";
}

/**
 * 영업 시간 포맷팅
 */
function formatHours(hours: HoursInfo[]): string {
  if (!hours || hours.length === 0) return "영업시간 정보 없음";

  const today = new Date().getDay();
  const todayDow = today === 0 ? 7 : today;

  const todayHours = hours.find((h) => h.dow === todayDow);

  if (!todayHours) return "영업시간 정보 없음";
  if (todayHours.is_holiday) return "휴무";

  const open = todayHours.open.substring(0, 5);
  const close = todayHours.close.substring(0, 5);

  return `${open} - ${close}`;
}

/**
 * 현재 영업 중인지 확인
 */
function isOpenNow(hours: HoursInfo[]): boolean {
  if (!hours || hours.length === 0) return false;

  const now = new Date();
  const today = now.getDay();
  const todayDow = today === 0 ? 7 : today;
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const todayHours = hours.find((h) => h.dow === todayDow);

  if (!todayHours || todayHours.is_holiday) return false;

  const [openH, openM] = todayHours.open.split(":").map(Number);
  const [closeH, closeM] = todayHours.close.split(":").map(Number);

  const openTime = openH * 60 + openM;
  let closeTime = closeH * 60 + closeM;

  if (closeTime < openTime) {
    closeTime += 24 * 60;
  }

  let adjustedCurrentTime = currentTime;
  if (currentTime < openTime && closeTime > 24 * 60) {
    adjustedCurrentTime += 24 * 60;
  }

  return adjustedCurrentTime >= openTime && adjustedCurrentTime <= closeTime;
}

interface RestaurantBasicInfoProps {
  restaurant: RestaurantDetailResponse;
}

/**
 * 식당 기본 정보 컴포넌트
 * - 영업시간, 가격대, 주소, 전화번호
 */
export default function RestaurantBasicInfo({
  restaurant,
}: RestaurantBasicInfoProps) {
  const [showLotAddress, setShowLotAddress] = useState(false);

  /**
   * 주소 복사 핸들러
   */
  const handleCopyAddress = async (address: string, type: string) => {
    try {
      await navigator.clipboard.writeText(address);
      alert(`${type} 주소가 복사되었습니다!`);
    } catch (err) {
      console.error("🍴 [주소 복사] 실패:", err);
      alert("주소 복사에 실패했습니다.");
    }
  };

  /**
   * 지번 주소 토글 핸들러
   */
  const handleToggleLotAddress = () => {
    setShowLotAddress(!showLotAddress);
  };

  return (
    <div className="bg-white p-6 space-y-4">
      {/* 상세 정보 */}
      <div className="space-y-3">
        {/* 영업 상태 */}
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {/* 영업시간 정보가 있을 때만 배지 표시 */}
              {formatHours(restaurant.hours) !== "영업시간 정보 없음" && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    isOpenNow(restaurant.hours)
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {isOpenNow(restaurant.hours) ? "영업중" : "영업종료"}
                </span>
              )}
              <span className="text-gray-900">
                {formatHours(restaurant.hours)}
              </span>
            </div>
          </div>
        </div>

        {/* 가격대 */}
        <div className="flex items-start gap-3">
          <DollarSign className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <span className="text-gray-900">
              {formatPriceRange(restaurant.price_range)}
            </span>
          </div>
        </div>

        {/* 주소 */}
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            {/* 도로명 주소 */}
            <div className="flex items-center justify-between gap-2">
              {/* 주소 + 복사 버튼 그룹 */}
              <div className="flex items-center gap-1">
                <p className="text-gray-900">{restaurant.address}</p>
                {/* 도로명 주소 복사 버튼 */}
                <button
                  onClick={() =>
                    handleCopyAddress(restaurant.address, "도로명")
                  }
                  className="p-1 rounded hover:bg-gray-100 transition-colors flex-shrink-0"
                  aria-label="도로명 주소 복사"
                >
                  <Copy className="w-3 h-3 text-gray-600" />
                </button>
              </div>
              {/* 지번 토글 버튼 */}
              {restaurant.address_lot && (
                <button
                  onClick={handleToggleLotAddress}
                  className="p-1 rounded hover:bg-gray-100 transition-colors flex-shrink-0"
                  aria-label="지번 주소 표시"
                >
                  {showLotAddress ? (
                    <ChevronUp className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              )}
            </div>

            {/* 지번 주소 (토글 시 표시) */}
            {restaurant.address_lot && showLotAddress && (
              <div className="flex items-center justify-between gap-2">
                {/* 지번 + 복사 버튼 그룹 */}
                <div className="flex items-center gap-1">
                  <p className="text-sm text-gray-600">
                    지번: {restaurant.address_lot}
                  </p>
                  {/* 지번 주소 복사 버튼 */}
                  <button
                    onClick={() =>
                      handleCopyAddress(restaurant.address_lot, "지번")
                    }
                    className="p-1 rounded hover:bg-gray-100 transition-colors flex-shrink-0"
                    aria-label="지번 주소 복사"
                  >
                    <Copy className="w-2.5 h-2.5 text-gray-600" />
                  </button>
                </div>
                {/* 드롭다운 버튼 자리 맞추기 위한 빈 공간 */}
                <div className="w-8"></div>
              </div>
            )}
          </div>
        </div>

        {/* 전화번호 */}
        {restaurant.phone && (
          <div className="flex items-start gap-3">
            <Phone className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <a
                href={`tel:${restaurant.phone}`}
                className="text-gray-900 hover:text-primary transition-colors"
              >
                {restaurant.phone}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
