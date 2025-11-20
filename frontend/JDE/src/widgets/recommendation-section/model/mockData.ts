// src/widgets/recommendation-section/model/mockData.ts
// 목적: 추천 섹션 Mock 데이터

/** 상권 인기식당 Top10 Mock 데이터 */
export const rankingMockData = [
  {
    id: 1,
    rank: 1,
    restaurantName: "맛있는 한식당",
    category: "한식",
    imageUrl: undefined, // placeholder 표시됨
    location: "강남역",
  },
  {
    id: 2,
    rank: 2,
    restaurantName: "중국집 맛집",
    category: "중식",
    imageUrl: "https://via.placeholder.com/144",
    location: "강남역",
  },
  {
    id: 3,
    rank: 3,
    restaurantName: "일식당 스시",
    category: "일식",
    imageUrl: "https://via.placeholder.com/144",
    location: "강남역",
  },
  {
    id: 4,
    rank: 4,
    restaurantName: "양식 레스토랑",
    category: "양식",
    imageUrl: "https://via.placeholder.com/144",
    location: "강남역",
  },
  {
    id: 5,
    rank: 5,
    restaurantName: "분식집 떡볶이",
    category: "분식",
    imageUrl: "https://via.placeholder.com/144",
    location: "강남역",
  },
  {
    id: 6,
    rank: 6,
    restaurantName: "치킨집 황금올리브",
    category: "치킨",
    imageUrl: "https://via.placeholder.com/144",
    location: "강남역",
  },
  {
    id: 7,
    rank: 7,
    restaurantName: "피자헛 강남점",
    category: "피자",
    imageUrl: "https://via.placeholder.com/144",
    location: "강남역",
  },
  {
    id: 8,
    rank: 8,
    restaurantName: "카페 베네",
    category: "카페",
    imageUrl: "https://via.placeholder.com/144",
    location: "강남역",
  },
  {
    id: 9,
    rank: 9,
    restaurantName: "고깃집 소고기",
    category: "고기",
    imageUrl: "https://via.placeholder.com/144",
    location: "강남역",
  },
  {
    id: 10,
    rank: 10,
    restaurantName: "해산물 전문점",
    category: "해산물",
    imageUrl: "https://via.placeholder.com/144",
    location: "강남역",
  },
];

/** 음식 종류별 카테고리 데이터 */
export const categoryMockData = [
  {
    id: "한식",
    categoryName: "한식",
  },
  {
    id: "중식",
    categoryName: "중식",
  },
  {
    id: "일식",
    categoryName: "일식",
  },
  {
    id: "양식",
    categoryName: "양식",
  },
  {
    id: "분식",
    categoryName: "분식",
  },
  {
    id: "치킨",
    categoryName: "치킨",
  },
  {
    id: "패스트푸드",
    categoryName: "패스트푸드",
  },
  {
    id: "디저트",
    categoryName: "디저트",
  },
  {
    id: "샐러드",
    categoryName: "샐러드",
  },
  {
    id: "아시아/퓨전",
    categoryName: "아시아/퓨전",
  },
  {
    id: "뷔페/패밀리",
    categoryName: "뷔페/패밀리",
  },
  {
    id: "술집",
    categoryName: "술집",
  },
];
