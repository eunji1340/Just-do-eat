// 목적: 추천 페이지. 백엔드에서 추천 식당 리스트를 페이징으로 가져와 덱에 전달

import * as React from "react";
import RestaurantSwipeDeck from "@/widgets/restaurantSwipe/RestaurantSwipeDeck";
import type { Restaurant } from "@/entities/restaurant/types";
import http from "@/shared/api/http";

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
    dow: number;           // 0=공휴일, 1=월, ... 7=일
    open: string;          // "HH:mm:ss"
    close: string;         // "HH:mm:ss"
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
type SwipeDir = "left" | "right" | "up";
type SwipeAction = "HOLD" | "DISLIKE" | "SELECT";

function mapDirToAction(dir: SwipeDir): SwipeAction {
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
// src/pages/swipe/SwipePage.tsx (동일 파일 내)

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
    price_range:
      (raw.price_range as Restaurant["price_range"]) ?? "MEDIUM",
    website_url: raw.kakao_url ?? "",
    menu: menu ?? [],
    distance_m: raw.distance_m,
    is_open: raw.is_open,
  };
}


export default function SwipePage() {
  const [items, setItems] = React.useState<Restaurant[]>([]);
  const [cursor, setCursor] = React.useState<string | null>("0"); // 🔥 문자열 기반
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // 🔥 최초 fetch 여부 체크용 ref
  const didInitRef = React.useRef(false);

  // ✅ 최초 1회: 초기 추천 리스트(fetch)
  React.useEffect(() => {
    if (didInitRef.current) return; // 이미 한 번 호출했으면 무시
    didInitRef.current = true;
    
    fetchMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 추천 리스트 가져오기 (10개씩)
  async function fetchMore() {
    if (loading) return;

    // cursor가 null이면 더 이상 요청하지 않음
    if (!cursor) {
      setHasMore(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await http.get<FeedResponse>("/main/feed", {
        params: { cursor },
      });

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
      console.error("[SwipePage] feed 로딩 실패:", err);
      setError(
        err?.response?.data?.detail ??
          err?.message ??
          "추천 리스트를 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleTopSwiped(dir: "left" | "right" | "up", item: Restaurant) {
    const action = mapDirToAction(dir);
    try {
      await http.post("/main/feed/swipe", {
        restaurantId: item.restaurant_id,
        action,
      });
    } catch (err) {
      console.error("[SwipePage] 스와이프 액션 전송 실패:", err);
    }
  }

  function handleDeckEmpty() {
    if (hasMore && !loading) {
      fetchMore();
    }
  }

  return (
    <main className="min-h-dvh bg-white flex items-center justify-center">
      <section className="w-full flex items-center justify-center">
        <div className="w-full max-w-xl">
          {error && (
            <div className="p-4 text-center text-sm text-red-500">
              {error}
            </div>
          )}

          {items.length === 0 && loading ? (
            <div className="h-dvh flex items-center justify-center text-gray-500">
              추천을 불러오는 중입니다...
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
