// 목적: 추천 페이지. 백엔드에서 추천 식당 리스트를 페이징으로 가져와 덱에 전달

import * as React from "react";
import { useCallback } from "react";
import { UtensilsCrossed } from "lucide-react";
import RestaurantSwipeDeck from "@/widgets/restaurantSwipe/RestaurantSwipeDeck";
import type { Restaurant } from "@/entities/restaurant/types";
import http from "@/shared/api/http";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TopNavBar } from "@/widgets/top-navbar/ui/TopNavBar";
import mockRestaurantsData from "@/mocks/model/images/mockRestaurants.json";
// ==== 백엔드 응답 타입 ====

// 백엔드에서 내려주는 raw item
// src/pages/swipe/SwipePage.tsx (상단 일부)

type BackendRestaurantItem = {
  restaurant_id: number;
  kakao_id: number;
  name: string;
  address: string;
  address_lot: string;
  phone: string | null;
  kakao_summary: {
    title: string;
    summary: string;
  } | null;
  category1: string;
  category2: string;
  category3: string | null;
  kakao_url: string;
  kakao_rating: number;
  kakao_review_cnt: number;
  blog_review_cnt: number;
  price_range: "LOW" | "MEDIUM" | "HIGH" | "PREMIUM";
  image: string[];
  menu: {
    name: string;
    price: number;
    is_recommend: boolean;
    is_ai_mate: boolean;
  }[];
  is_parking: boolean | null;
  is_reservation: boolean | null;
  hours: {
    dow: number; // 0=공휴일, 1=월, ... 7=일
    open: string; // "HH:mm:ss"
    close: string; // "HH:mm:ss"
    break_open: string | null;
    break_close: string | null;
    is_holiday: boolean;
  }[];
  distance_m: number;
  is_open: boolean;
};

type FeedResponse = {
  items: BackendRestaurantItem[];
  next_cursor: string | null;
};

// 스와이프 방향 → 백엔드 액션 매핑
type FeedDir = "left" | "right" | "up";
type FeedAction = "HOLD" | "DISLIKE" | "SELECT";

function mapDirToAction(dir: FeedDir): FeedAction {
  switch (dir) {
    case "right":
      return "SELECT"; // 갈게요
    case "left":
      return "DISLIKE"; // 싫어요
    case "up":
    default:
      return "HOLD"; // 보류
  }
}

// 🔥 핵심: 백엔드 item → 프론트 Restaurant 타입으로 변환
// src/pages/feed/FeedPage.tsx (동일 파일 내)

function mapBackendToRestaurant(raw: BackendRestaurantItem): Restaurant {
  // 메뉴: name + price만 사용하는데, 추천 플래그는 나중에 타입 확장해서 써도 됨
  const menu = raw.menu?.map((m) => ({
    name: m.name,
    price: m.price,
  }));

  return {
    restaurant_id: raw.restaurant_id,
    name: raw.name,
    address: raw.address,
    phone: raw.phone ?? "",
    summary:
      raw.kakao_summary?.summary ??
      raw.kakao_summary?.title ??
      "설명이 아직 없어요.",
    image: raw.image ?? [],
    // 카테고리: 중분류(술집 등) 우선, 없으면 대분류
    category: raw.category2 || raw.category1 || "기타",
    rating: raw.kakao_rating ?? 0,
    // price_range는 이제 PREMIUM까지 올 수 있음
    price_range: (raw.price_range as Restaurant["price_range"]) ?? "MEDIUM",
    website_url: raw.kakao_url ?? "",
    menu: menu ?? [],
    distance_m: raw.distance_m,
    is_open: raw.is_open,
    hours: raw.hours ?? null,
  };
}

export default function FeedPage() {
  const [items, setItems] = React.useState<Restaurant[]>([]);
  const [cursor, setCursor] = React.useState<string | null>("0"); // 🔥 문자열 기반
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 쿼리 파라미터에서 카테고리와 mock 플래그 읽기
  const category = searchParams.get("category");
  const useMock = searchParams.get("mock") === "true";

  // ✅ 추천 리스트 가져오기 (10개씩)
  const fetchMore = useCallback(
    async (currentCursor: string | null) => {
      // cursor가 null이면 더 이상 요청하지 않음
      if (!currentCursor) {
        setHasMore(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let res;

        if (category) {
          // 카테고리별 추천
          console.log(
            `🍽️ [카테고리 피드] API 호출 - 카테고리: ${category}, cursor: ${currentCursor}`
          );
          res = await http.get<FeedResponse>(
            `/main/restaurants/popular/category`,
            {
              params: { category, cursor: currentCursor },
            }
          );
        } else {
          // 개인 추천
          if (useMock) {
            // 목업 데이터 사용
            console.log(`✨ [개인 피드] 목업 데이터 사용`);
            const mockData: FeedResponse = {
              items: mockRestaurantsData.items as BackendRestaurantItem[],
              next_cursor: mockRestaurantsData.next_cursor,
            };
            res = { data: mockData };
          } else {
            // 원래 API 사용
            console.log(`✨ [개인 피드] API 호출 - cursor: ${currentCursor}`);
            res = await http.get<FeedResponse>("/main/feed", {
              params: { cursor: currentCursor },
            });
          }
        }

        const backendItems = res.data.items ?? [];
        const mapped = backendItems.map(mapBackendToRestaurant);

        setItems((prev) => [...prev, ...mapped]);

        // 🔥 next_cursor 반영
        const nextCursor = res.data.next_cursor;
        setCursor(nextCursor);

        if (!nextCursor) {
          setHasMore(false);
        }
      } catch (err: any) {
        console.error("[FeedPage] feed 로딩 실패:", err);
        setError(
          err?.response?.data?.detail ??
            err?.message ??
            "추천 리스트를 불러오지 못했습니다."
        );
      } finally {
        setLoading(false);
      }
    },
    [category, useMock]
  );

  // ✅ URL 파라미터 변경 시 초기화 및 데이터 로드
  React.useEffect(() => {
    // 상태 초기화
    setItems([]);
    setCursor("0");
    setHasMore(true);
    setError(null);

    // 데이터 로드
    fetchMore("0");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, useMock]);

  async function handleTopSwiped(
    dir: "left" | "right" | "up",
    item: Restaurant
  ) {
    const action = mapDirToAction(dir);
    const overlayHoldMs = 700;

    // 🔐 로그인 체크: 로컬 스토리지에서 토큰 확인
    const token = localStorage.getItem("accessToken");
    const isLoggedIn = !!token;

    // 로그인한 사용자만 스와이프 액션 전송
    if (isLoggedIn) {
      try {
        await http.post("/main/feed/swipe", {
          restaurantId: item.restaurant_id,
          action,
        });
        console.log(
          `✅ [스와이프 액션] 전송 성공 - restaurantId: ${item.restaurant_id}, action: ${action}`
        );
      } catch (err) {
        console.error("[FeedPage] 스와이프 액션 전송 실패:", err);
      }
    } else {
      console.log(
        `⚠️ [비로그인] 스와이프 액션 전송 스킵 - restaurantId: ${item.restaurant_id}, action: ${action}`
      );
    }

    // SELECT(우 스와이프) 시 메인 페이지로 이동
    if (dir === "right") {
      setTimeout(() => {
        navigate("/");
      }, overlayHoldMs); // 700ms 정도
      return;
    }
  }

  function handleDeckEmpty() {
    if (hasMore && !loading && cursor) {
      fetchMore(cursor);
    }
  }

  // 뒤로가기 핸들러
  function handleBack() {
    navigate(-1);
  }

  // 검색 핸들러
  function handleSearchClick() {
    navigate("/search/start");
  }

  return (
    <main className="min-h-dvh bg-white">
      {/* TopNavBar - simple variant */}
      <TopNavBar
        variant="simple"
        onBack={handleBack}
        onSearchClick={handleSearchClick}
        showHomeButton={false}
      />

      {/* negative margin으로 네비바 위로 올리기 */}
      <section className="-mt-[52px] w-full h-dvh flex items-center justify-center">
        <div className="w-full max-w-xl h-full">
          {error && (
            <div className="p-4 text-center text-sm text-red-500">{error}</div>
          )}

          {items.length === 0 && loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-6">
              {/* 스피너와 아이콘 */}
              <div className="relative">
                {/* 배경 원형 그라데이션 */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 animate-pulse"></div>
                {/* 회전하는 스피너 */}
                <div className="relative w-20 h-20 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                {/* 중앙 아이콘 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <UtensilsCrossed className="w-8 h-8 text-orange-500" />
                </div>
              </div>

              {/* 텍스트 */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-lg font-semibold text-neutral-700">
                  맛집을 찾고 있어요
                </p>
                <p className="text-sm text-neutral-500">
                  잠시만 기다려주세요...
                </p>
              </div>
            </div>
          ) : (
            <RestaurantSwipeDeck
              items={items}
              onTopSwiped={handleTopSwiped}
              onDeckEmpty={handleDeckEmpty}
              hasMore={hasMore}
            />
          )}
        </div>
      </section>
    </main>
  );
}
