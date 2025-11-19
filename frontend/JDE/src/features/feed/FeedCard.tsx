// 목적: 배경은 전면 이미지, 하단엔 윗모서리만 둥근 설명 카드(바텀시트 느낌)

import { useState, useEffect } from "react";
import { Clock, MapPin, DollarSign, Phone } from "lucide-react";
import { useSwipeHandler } from "./useSwipeHandler";
import type { Restaurant, HoursInfo } from "@/entities/restaurant/types";

type Props = {
  data: Restaurant;
  onMove: (o: { x: number; y: number }) => void;
  onSwiped: (dir: "left" | "right" | "up") => void;
};

/**
 * 영업 시간 포맷팅 (오늘 기준)
 */
function formatHours(hours: HoursInfo[] | null): string {
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
function isOpenNow(hours: HoursInfo[] | null): boolean {
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

/**
 * 거리 포맷팅
 */
function formatDistance(m?: number) {
  if (!m && m !== 0) return "-";
  if (m >= 1000) return `${(m / 1000).toFixed(1)}km`;
  return `${m}m`;
}

/**
 * 가격대 포맷팅
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

export default function FeedCard({ data, onMove, onSwiped }: Props) {
  const { offset, handleStart, handleMove, handleEnd } = useSwipeHandler({
    onMove,
    onSwipe: onSwiped,
  });

  // 🔄 2초마다 거리 <-> 주소 토글
  const [showAddress, setShowAddress] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowAddress((prev) => !prev);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="absolute inset-0"
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px) rotate(${
          offset.x * 0.05
        }deg)`,
        transition: "transform 80ms linear",
      }}
    >
      <div className="relative w-full h-dvh">
        {/* 1) 전체 배경 이미지 (카드 아래로 깔림) */}
        <img
          src={data.image[0]}
          alt={data.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* 가독성 보조 그라데이션(아래쪽만 살짝 어둡게) */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-black/5 to-transparent" />

        {/* 2) 하단 바텀시트 카드: 위쪽만 둥글게, 떠있는 그림자 */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="rounded-t-3xl bg-white shadow-2xl p-3">
            <div className="p-5">
              {/* 상단 보조 정보 라인 */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{data.category ?? "카테고리"}</span>
                <span>
                  카카오 별점{" "}
                  <b className="text-gray-800">
                    {(data.rating ?? 0).toFixed(1)}
                  </b>
                </span>
              </div>

              {/* 식당명 */}
              <h2 className="mt-3 text-xl font-extrabold text-gray-900">
                {data.name}
              </h2>

              {/* 대표 메뉴 (있으면 노출) */}
              <div className="mt-2 text-sm text-gray-700">
                <div className="text-gray-500">
                  {data.menu?.[0]?.name ? data.menu[0].name : "정보 없음"}
                  <br />
                  {data.menu?.[1]?.name ? data.menu[1].name : "정보 없음"}
                </div>
              </div>

              {/* 아이콘 정보 */}
              <div className="mt-3 space-y-2 text-sm text-gray-700">
                {/* 1. 영업상태 */}
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-0.5 text-gray-500" />
                  <div className="flex items-center gap-2 leading-5">
                    {/* 영업시간 정보가 있을 때만 배지 표시 */}
                    {formatHours(data.hours) !== "영업시간 정보 없음" && (
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          isOpenNow(data.hours)
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {isOpenNow(data.hours) ? "영업중" : "영업종료"}
                      </span>
                    )}
                    <span className="text-gray-700">
                      {formatHours(data.hours)}
                    </span>
                  </div>
                </div>

                {/* 2. 가격대 */}
                <div className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 mt-0.5 text-gray-500" />
                  <span className="leading-5">
                    {formatPriceRange(data.price_range)}
                  </span>
                </div>

                {/* 3. 주소 - 2초마다 거리 <-> 도로명주소 토글 */}
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
                  <div className="relative leading-5 flex-1 overflow-hidden">
                    {/* 2호선 역삼역에서 거리 */}
                    <span
                      className={`flex items-center gap-1.5 transition-all duration-500 ${
                        showAddress
                          ? "opacity-0 -translate-y-2"
                          : "opacity-100 translate-y-0"
                      }`}
                    >
                      {/* 2호선 아이콘 */}
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500 text-white text-xs font-bold flex-shrink-0">
                        2
                      </span>
                      역삼역에서 {formatDistance(data.distance_m)}
                    </span>
                    {/* 도로명 주소 */}
                    <span
                      className={`block absolute top-0 left-0 right-0 transition-all duration-500 ${
                        showAddress
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-2"
                      }`}
                    >
                      {data.address}
                    </span>
                  </div>
                </div>

                {/* 4. 전화번호 */}
                {data.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 mt-0.5 text-gray-500" />
                    <a
                      href={`tel:${data.phone}`}
                      className="leading-5 text-gray-700 hover:text-primary transition-colors"
                    >
                      {data.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* 안전 영역(노치/홈바) 대응 여백 */}
            <div className="pb-16" />
          </div>
        </div>
      </div>
    </div>
  );
}
