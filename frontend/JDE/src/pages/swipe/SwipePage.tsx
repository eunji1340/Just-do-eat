// 목적: 추천 페이지. 로컬 ITEMS를 덱에 전달(네트워크 없음)

import RestaurantSwipeDeck from "@/widgets/restaurantSwipe/RestaurantSwipeDeck";
import type { Restaurant } from "@/entities/restaurant/types";

const ITEMS: Restaurant[] = [
  {
    restaurant_id: 901,
    name: "맛있는 한식당",
    address: "서울시 강남구 테헤란로 123",
    phone: "02-1234-5678",
    summary: "전통 한식을 현대적으로 재해석한 분위기 있는 한식당",
    image: [
      "https://picsum.photos/id/1018/1200/800",
      "https://picsum.photos/id/1015/1200/800",
    ],
    category: "한식",
    rating: 4.5,
    price_range: "MEDIUM",
    website_url: "https://place.map.kakao.com/m/12345678",
    menu: [
      { name: "불고기", price: 15000 },
      { name: "비빔밥", price: 12000 },
      { name: "된장찌개", price: 9000 },
    ],
    distance_m: 500,
    is_open: true,
  },
  {
    restaurant_id: 904,
    name: "매콤한 치킨집",
    address: "서울시 강남구 선릉로 321",
    phone: "02-4567-8901",
    summary: "바삭한 치킨과 양념치킨이 일품인 치킨 전문점",
    image: [
      "https://picsum.photos/id/1025/1200/800",
      "https://picsum.photos/id/1020/1200/800",
    ],
    category: "치킨",
    rating: 4.6,
    price_range: "MEDIUM",
    website_url: "https://place.map.kakao.com/m/45678901",
    menu: [
      { name: "후라이드 치킨", price: 17000 },
      { name: "양념치킨", price: 18000 },
      { name: "간장치킨", price: 19000 },
    ],
    distance_m: 300,
    is_open: true,
  },
  // 필요 시 더 추가
];

export default function SwipePage() {
  return (
    <main className="min-h-dvh bg-white flex items-center justify-center">
      <section className="w-full flex items-center justify-center">
        <div className="w-full max-w-xl">
          <RestaurantSwipeDeck
            items={ITEMS}
            onTopSwiped={(dir, item) => {
              console.log("swiped:", dir, item.restaurant_id);
            }}
          />
        </div>
      </section>
    </main>
  );
}
