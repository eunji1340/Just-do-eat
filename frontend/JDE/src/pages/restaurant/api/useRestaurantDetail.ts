// src/pages/restaurant/api/useRestaurantDetail.ts
// 목적: 식당 상세 정보 API 호출 커스텀 훅

import { useState, useEffect } from "react";
import axios from "axios";

// ============================================
// 타입 정의
// ============================================

/**
 * 카카오 요약 정보
 */
export type KakaoSummary = {
  title: string;
  summary: string;
};

/**
 * 메뉴 정보
 */
export type MenuInfo = {
  name: string;
  price: number;
  is_recommend: boolean;
  is_ai_mate: boolean;
};

/**
 * 영업 시간 정보
 */
export type HoursInfo = {
  dow: number; // 요일 (1: 월요일, 7: 일요일)
  open: string; // 오픈 시간 "HH:MM:SS"
  close: string; // 마감 시간 "HH:MM:SS"
  break_open: string | null;
  break_close: string | null;
  is_holiday: boolean;
};

/**
 * 식당 상세 API 응답
 */
export type RestaurantDetailResponse = {
  restaurant_id: number;
  kakao_id: number;
  name: string;
  address: string;
  address_lot: string;
  phone: string;
  kakao_summary: KakaoSummary;
  category1: string;
  category2: string;
  category3: string;
  kakao_url: string;
  kakao_rating: number;
  kakao_review_cnt: number;
  blog_review_cnt: number;
  price_range: "LOW" | "MEDIUM" | "HIGH" | "PREMIUM";
  image: string[];
  menu: MenuInfo[];
  is_parking: boolean;
  is_reservation: boolean;
  hours: HoursInfo[];
};

// ============================================
// 커스텀 훅
// ============================================

/**
 * 식당 상세 정보 조회 훅
 * @param restaurantId - 식당 ID
 * @returns restaurant: 식당 정보, isLoading: 로딩 상태, error: 에러 메시지
 */
export function useRestaurantDetail(restaurantId: string | undefined) {
  const [restaurant, setRestaurant] = useState<RestaurantDetailResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ID가 없으면 에러
    if (!restaurantId) {
      setError("식당 ID가 없습니다");
      return;
    }

    const abortController = new AbortController();
    let isCancelled = false;

    const fetchRestaurantDetail = async () => {
      console.log("🍴 [식당상세] API 호출 시작 - ID:", restaurantId);
      setIsLoading(true);
      setError(null);

      try {
        // API 호출
        const baseURL =
          import.meta.env.VITE_API_BASE_URL || "https://justdoeat.ai.kr/api/";
        const fullUrl = `${baseURL}restaurants/${restaurantId}`;
        console.log("🍴 [식당상세] 요청 URL:", fullUrl);

        const response = await axios.get<RestaurantDetailResponse>(fullUrl, {
          signal: abortController.signal,
          timeout: 30000,
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        });

        if (isCancelled) return;

        console.log("🍴 [식당상세] API 응답:", response.data);
        setRestaurant(response.data);
      } catch (err) {
        if (isCancelled) return;

        console.error("🍴 [식당상세] API 오류:", err);

        let errorMessage = "식당 정보를 불러오는 중 오류가 발생했습니다";

        if (axios.isAxiosError(err)) {
          if (err.code === "ERR_NETWORK") {
            errorMessage = "네트워크 연결을 확인해주세요";
          } else if (
            err.code === "ECONNABORTED" ||
            err.message.includes("timeout")
          ) {
            errorMessage = "요청 시간이 초과되었습니다";
          } else if (err.response) {
            const status = err.response.status;
            if (status === 404) {
              errorMessage = "식당을 찾을 수 없습니다";
            } else if (status === 500) {
              errorMessage = "서버 오류가 발생했습니다";
            }
          }
        }

        setError(errorMessage);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchRestaurantDetail();

    // 클린업
    return () => {
      isCancelled = true;
      abortController.abort();
      console.log("🍴 [식당상세] 클린업 실행");
    };
  }, [restaurantId]);

  return { restaurant, isLoading, error };
}
