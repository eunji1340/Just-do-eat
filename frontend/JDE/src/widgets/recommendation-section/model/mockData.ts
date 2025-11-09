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

/** 음식 종류별 카테고리 Mock 데이터 */
export const categoryMockData = [
  {
    id: "korean",
    categoryName: "한식",
    imageUrl: "https://via.placeholder.com/80",
  },
  {
    id: "chinese",
    categoryName: "중식",
    imageUrl: "https://via.placeholder.com/80",
  },
  {
    id: "japanese",
    categoryName: "일식",
    imageUrl: "https://via.placeholder.com/80",
  },
  {
    id: "western",
    categoryName: "양식",
    imageUrl: "https://via.placeholder.com/80",
  },
  {
    id: "snack",
    categoryName: "분식",
    imageUrl: "https://via.placeholder.com/80",
  },
  {
    id: "chicken",
    categoryName: "치킨",
    imageUrl: "https://via.placeholder.com/80",
  },
  {
    id: "pizza",
    categoryName: "피자",
    imageUrl: "https://via.placeholder.com/80",
  },
  {
    id: "cafe",
    categoryName: "카페",
    imageUrl: "https://via.placeholder.com/80",
  },
  {
    id: "meat",
    categoryName: "고기",
    imageUrl: "https://via.placeholder.com/80",
  },
  {
    id: "seafood",
    categoryName: "해산물",
    imageUrl: "https://via.placeholder.com/80",
  },
];
