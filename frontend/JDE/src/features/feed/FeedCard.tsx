// 목적: 피드 개별 카드 UI + 드래그 스와이프 제스처 처리
// 특징:
// - transform: translate + rotate 로 진행되는 스와이프 애니메이션
// - Deck 컨테이너에서 제어하는 transitionEnabled 적용
// - 카드 내부 UI는 가볍게 유지(복잡 로직 없음)
// - 버그 방지: 버튼 클릭 시 FeedCard가 transition 영향 안 받도록 구조 보완
// - 이미지 전체 표시: object-fit contain + 패딩으로 하단 카드에 가려지지 않도록 처리

import { Clock, MapPin, DollarSign, Phone } from "lucide-react";
import { useSwipeHandler } from "./useSwipeHandler";
import { useEffect, useState } from "react";
import type { Restaurant, HoursInfo } from "@/entities/restaurant/types";

type Props = {
  data: Restaurant;
  offset: { x: number; y: number }; // Deck에서 내려주는 transform 위치
  isDragging: boolean;
  onMove: (o: { x: number; y: number }) => void; // Deck → 오프셋 반영
  onSwiped: (dir: "left" | "right" | "up") => void;
  transitionEnabled: boolean; // Deck에서 animate ON/OFF 전달
  resetHandler?: (fn: () => void) => void; // Deck → SwipeHandler reset 연결
};

/* -----------------------------
 * 유틸 함수: 영업시간 포맷
 * ----------------------------- */
function formatHours(hours: HoursInfo[] | null) {
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

/* -----------------------------
 * 현재 영업중 판단
 * ----------------------------- */
function isOpenNow(hours: HoursInfo[] | null): boolean {
  if (!hours) return false;
  const now = new Date();
  const todayDow = now.getDay() === 0 ? 7 : now.getDay();
  const cur = now.getHours() * 60 + now.getMinutes();

  const h = hours.find((x) => x.dow === todayDow);
  if (!h || h.is_holiday) return false;

  const [oH, oM] = h.open.split(":").map(Number);
  const [cH, cM] = h.close.split(":").map(Number);

  let open = oH * 60 + oM;
  let close = cH * 60 + cM;
  if (close < open) close += 1440;

  let nowMin = cur;
  if (cur < open && close > 1440) nowMin += 1440;

  return nowMin >= open && nowMin <= close;
}

/* -----------------------------
 * 거리 포맷
 * ----------------------------- */
function formatDistance(m?: number) {
  if (!m && m !== 0) return "-";
  if (m >= 1000) return `${(m / 1000).toFixed(1)}km`;
  return `${m}m`;
}

/* -----------------------------
 * 가격대 포맷
 * ----------------------------- */
function formatPriceRange(r: string) {
  const map: Record<string, string> = {
    LOW: "~1만원",
    MEDIUM: "1~3만원대",
    HIGH: "3~6만원",
    PREMIUM: "6만원~",
  };
  return map[r] ?? "₩₩";
}

export default function FeedCard({
  data,
  offset,
  onMove,
  onSwiped,
  transitionEnabled,
  resetHandler,
}: Props) {
  /* -----------------------------------------
   * useSwipeHandler: 드래그 → 좌/우/위 스와이프 판정
   * ----------------------------------------- */
  const { handleStart, handleMove, handleEnd, reset } = useSwipeHandler({
    onMove,
    onSwipe: onSwiped,
  });

  // Deck → reset 연결
  useEffect(() => {
    resetHandler?.(reset);
  }, [resetHandler]);

  /* -----------------------------------------
   * 이미지 슬라이드 (3초 간격)
   * ----------------------------------------- */
  const [imgIdx, setImgIdx] = useState(0);
  useEffect(() => {
    if (!data.image || data.image.length <= 1) return;
    const id = setInterval(
      () => setImgIdx((i) => (i + 1) % data.image.length),
      3000
    );
    return () => clearInterval(id);
  }, [data.image]);

  /* -----------------------------------------
   * 거리 ↔ 주소 2초마다 교차
   * ----------------------------------------- */
  const [showAddress, setShowAddress] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setShowAddress((v) => !v), 2000);
    return () => clearInterval(id);
  }, []);

  /* -----------------------------------------
   * 회전 효과: x 드래그 비율로 -12° ~ 12°
   * ----------------------------------------- */
  const rotate = Math.max(-12, Math.min(12, offset.x * 0.04));

  return (
    <div
      className="absolute inset-0 swipe-card-transition"
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      style={{
        // transform: Deck에서 내려준 offset + 회전
        transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotate}deg)`,

        // 이 부분이 중요:
        // Deck의 transitionEnabled를 그대로 사용해야 버튼 클릭시 FeedCard가 자연스럽게 날아감
        willChange: "transform",
      }}
    >
      {/* 배경 이미지 영역 - 하단 카드를 고려한 레이아웃 */}
      <div className="relative w-full h-dvh">
        {/* 
          이미지 컨테이너: 
          - 상단 16px, 하단 280px 여백을 제외한 영역에서 이미지 표시
          - h-[calc(100dvh-296px)]로 정확한 높이 계산
          - 이렇게 하면 이미지가 상하단 모두 잘리지 않음
        */}
        <div className="absolute top-4 left-0 right-0 h-[calc(100dvh-296px)]">
          <img
            src={data.image?.[imgIdx] ?? data.image?.[0]}
            alt={data.name}
            className="w-full h-full object-contain"
            style={
              {
                // object-contain으로 이미지 전체가 보이도록 조정
                // 이미지 크기가 작으면 중앙 정렬, 크면 비율 유지하며 축소
              }
            }
          />

          {/* 상단 그라데이션 → 텍스트 가독성 향상 (이미지 위에만 적용) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent pointer-events-none" />
        </div>

        {/* 바텀 시트 (원래 스타일 유지) */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="rounded-t-3xl bg-white shadow-2xl p-3">
            <div className="p-5">
              {/* 카테고리 & 별점 */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{data.category}</span>
                <span>
                  별점 <b>{(data.rating ?? 0).toFixed(1)}</b>
                </span>
              </div>

              {/* 식당명 */}
              <h2 className="mt-3 text-xl font-extrabold text-gray-900">
                {data.name}
              </h2>

              {/* 메뉴 (상위 2개) */}
              <div className="mt-2 text-sm text-gray-700">
                <div className="text-gray-500">
                  {data.menu?.[0]?.name ?? "정보 없음"}
                  <br />
                  {data.menu?.[1]?.name ?? ""}
                </div>
              </div>

              {/* 아이콘 정보 */}
              <div className="mt-3 space-y-2 text-sm text-gray-700">
                {/* 영업 상태 */}
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-0.5 text-gray-500" />
                  <div className="flex items-center gap-2 leading-5">
                    {formatHours(data.hours) !== "영업시간 정보 없음" && (
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          isOpenNow(data.hours)
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {isOpenNow(data.hours) ? "영업중" : "영업종료"}
                      </span>
                    )}
                    <span>{formatHours(data.hours)}</span>
                  </div>
                </div>

                {/* 가격대 */}
                <div className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 mt-0.5 text-gray-500" />
                  <span>{formatPriceRange(data.price_range)}</span>
                </div>

                {/* 거리/주소 교차 */}
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-gray-500" />
                  <div className="relative leading-5 flex-1 overflow-hidden">
                    {/* 거리 */}
                    <span
                      className={`flex items-center gap-1.5 transition-all duration-500 ${
                        showAddress
                          ? "opacity-0 -translate-y-2"
                          : "opacity-100 translate-y-0"
                      }`}
                    >
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500 text-white text-xs font-bold">
                        2
                      </span>
                      역삼역에서 {formatDistance(data.distance_m)}
                    </span>

                    {/* 주소 */}
                    <span
                      className={`absolute top-0 left-0 right-0 transition-all duration-500 ${
                        showAddress
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-2"
                      }`}
                    >
                      {data.address}
                    </span>
                  </div>
                </div>

                {/* 전화번호 */}
                {data.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 mt-0.5 text-gray-500" />
                    <a
                      href={`tel:${data.phone}`}
                      className="text-gray-700 hover:text-primary"
                    >
                      {data.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* 하단 Safe Area (원래 유지) */}
            <div className="pb-16" />
          </div>
        </div>
      </div>

      {/* transform transition 제어 */}
      <style>{`
        .swipe-card-transition {
          transition: ${
            transitionEnabled
              ? "transform 1.5s cubic-bezier(0.22, 1, 0.36, 1)"
              : "transform 0ms"
          };
        }
      `}</style>
    </div>
  );
}
