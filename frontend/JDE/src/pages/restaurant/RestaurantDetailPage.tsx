import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { TopNavBar } from "@/widgets/top-navbar";
import {
  Share2,
  Star,
  MapPin,
  Phone,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
} from "lucide-react";

// ============================================
// 전역 타입 선언 (카카오맵)
// ============================================
declare global {
  interface Window {
    kakao: any;
  }
}

// ============================================
// 타입 정의
// ============================================

/**
 * 카카오 요약 정보
 */
type KakaoSummary = {
  title: string;
  summary: string;
};

/**
 * 메뉴 정보
 */
type MenuInfo = {
  name: string;
  price: number;
  is_recommend: boolean;
  is_ai_mate: boolean;
};

/**
 * 영업 시간 정보
 */
type HoursInfo = {
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
type RestaurantDetailResponse = {
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
// 목 데이터 (임시 - TODO: API 연결 시 제거)
// ============================================

const MOCK_RESTAURANT: RestaurantDetailResponse = {
  restaurant_id: 1001,
  kakao_id: 27347714,
  name: "아리네술상",
  address: "서울 강남구 논현로94길 11",
  address_lot: "서울 강남구 역삼동 669-16",
  phone: "02-1234-5678",
  kakao_summary: {
    title: "피규어 가득한 감성 이자카야 술상",
    summary:
      "역삼역 근처에 위치한 이자카야 스타일의 술집으로, 다양한 안주와 일식 메뉴를 제공합니다.",
  },
  category1: "음식점",
  category2: "술집",
  category3: "실내포장마차",
  kakao_url: "http://place.map.kakao.com/27347714",
  kakao_rating: 4.1,
  kakao_review_cnt: 10,
  blog_review_cnt: 27,
  price_range: "MEDIUM",
  image: [
    "http://t1.daumcdn.net/local/kakaomapPhoto/review/3166313fc72c663dd1a368548ddaed18792cbfdb?original",
  ],
  menu: [
    {
      name: "연어랑 육회랑",
      price: 37000,
      is_recommend: false,
      is_ai_mate: false,
    },
    {
      name: "생연어회",
      price: 26000,
      is_recommend: true,
      is_ai_mate: false,
    },
    {
      name: "소고기 타다끼 1등급++",
      price: 25000,
      is_recommend: false,
      is_ai_mate: true,
    },
    {
      name: "골뱅이 무침",
      price: 20000,
      is_recommend: false,
      is_ai_mate: false,
    },
    {
      name: "치즈 계란말이",
      price: 15000,
      is_recommend: false,
      is_ai_mate: false,
    },
  ],
  is_parking: false,
  is_reservation: true,
  hours: [
    {
      dow: 1,
      open: "18:00:00",
      close: "02:00:00",
      break_open: null,
      break_close: null,
      is_holiday: false,
    },
    {
      dow: 2,
      open: "18:00:00",
      close: "02:00:00",
      break_open: null,
      break_close: null,
      is_holiday: false,
    },
    {
      dow: 3,
      open: "18:00:00",
      close: "02:00:00",
      break_open: null,
      break_close: null,
      is_holiday: false,
    },
    {
      dow: 4,
      open: "18:00:00",
      close: "02:00:00",
      break_open: null,
      break_close: null,
      is_holiday: false,
    },
    {
      dow: 5,
      open: "18:00:00",
      close: "02:00:00",
      break_open: null,
      break_close: null,
      is_holiday: false,
    },
    {
      dow: 6,
      open: "18:00:00",
      close: "02:00:00",
      break_open: null,
      break_close: null,
      is_holiday: false,
    },
    {
      dow: 7,
      open: "18:00:00",
      close: "02:00:00",
      break_open: null,
      break_close: null,
      is_holiday: true,
    },
  ],
};

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 주소에서 동 이름만 추출
 * @param address - 전체 주소
 * @returns 동 이름 (예: "역삼동")
 */
function extractDong(address: string): string {
  const match = address.match(/([가-힣]+동)/);
  return match ? match[1] : "";
}

/**
 * 가격대를 표시 문자열로 변환
 */
function formatPriceRange(priceRange: string): string {
  const map: Record<string, string> = {
    LOW: "₩",
    MEDIUM: "₩₩",
    HIGH: "₩₩₩",
    PREMIUM: "₩₩₩₩",
  };
  return map[priceRange] || "₩₩";
}

/**
 * 영업 시간 포맷팅
 * @param hours - 영업 시간 배열
 * @returns 포맷된 영업 시간 문자열
 */
function formatHours(hours: HoursInfo[]): string {
  if (!hours || hours.length === 0) return "영업시간 정보 없음";

  const today = new Date().getDay(); // 0: 일요일, 1: 월요일, ...
  const todayDow = today === 0 ? 7 : today; // 1: 월, 2: 화, ..., 7: 일

  const todayHours = hours.find((h) => h.dow === todayDow);

  if (!todayHours) return "영업시간 정보 없음";
  if (todayHours.is_holiday) return "휴무";

  const open = todayHours.open.substring(0, 5); // "HH:MM"
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
  const currentTime = now.getHours() * 60 + now.getMinutes(); // 분 단위

  const todayHours = hours.find((h) => h.dow === todayDow);

  if (!todayHours || todayHours.is_holiday) return false;

  const [openH, openM] = todayHours.open.split(":").map(Number);
  const [closeH, closeM] = todayHours.close.split(":").map(Number);

  const openTime = openH * 60 + openM;
  let closeTime = closeH * 60 + closeM;

  // 자정 넘어가는 경우 (예: 02:00)
  if (closeTime < openTime) {
    closeTime += 24 * 60;
  }

  let adjustedCurrentTime = currentTime;
  if (currentTime < openTime && closeTime > 24 * 60) {
    adjustedCurrentTime += 24 * 60;
  }

  return adjustedCurrentTime >= openTime && adjustedCurrentTime <= closeTime;
}

// ============================================
// 메인 컴포넌트
// ============================================

/**
 * 식당 상세 페이지
 * - 식당 정보, 메뉴, 영업시간 등 표시
 * - 비회원 접근 가능
 */
export default function RestaurantDetailPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();

  // 식당 상세 정보 상태
  const [restaurant, setRestaurant] = useState<RestaurantDetailResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 지번 주소 표시 토글 상태
  const [showLotAddress, setShowLotAddress] = useState(false);

  // 지도 표시 상태
  const [mapLoaded, setMapLoaded] = useState(false);

  // 식당 상세 API 호출
  useEffect(() => {
    if (!restaurantId) {
      setError("식당 ID가 없습니다");
      return;
    }

    const abortController = new AbortController();
    let isCancelled = false;

    const fetchRestaurantDetail = async () => {
      console.log("🍴 [식당상세] 목 데이터 로딩 시작 - ID:", restaurantId);
      setIsLoading(true);
      setError(null);

      try {
        // TODO: API 연결 시 아래 주석 해제하고 목 데이터 제거
        // const baseURL = "http://k13a701.p.ssafy.io/api";
        // const fullUrl = `${baseURL}/restaurants/${restaurantId}`;
        // const response = await axios.get<RestaurantDetailResponse>(fullUrl, {
        //   signal: abortController.signal,
        //   timeout: 30000,
        //   withCredentials: true,
        //   headers: { "Content-Type": "application/json" },
        // });
        // setRestaurant(response.data);

        // 임시: 목 데이터 사용 (로딩 효과 시뮬레이션)
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (isCancelled) return;

        console.log("🍴 [식당상세] 목 데이터 로딩 완료");
        setRestaurant(MOCK_RESTAURANT);
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

    return () => {
      isCancelled = true;
      abortController.abort();
    };
  }, [restaurantId]);

  /**
   * 공유 버튼 클릭 핸들러
   */
  const handleShare = async () => {
    if (!restaurant) return;

    const shareData = {
      title: restaurant.name,
      text: `${restaurant.name} - ${restaurant.kakao_summary.title}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        console.log("🍴 [공유] 성공");
      } else {
        // Web Share API 미지원 시 URL 복사
        await navigator.clipboard.writeText(window.location.href);
        alert("링크가 복사되었습니다!");
      }
    } catch (err) {
      console.error("🍴 [공유] 실패:", err);
    }
  };

  /**
   * 검색 버튼 클릭 핸들러
   */
  const handleSearchClick = () => {
    navigate("/search/start");
  };

  /**
   * 뒤로가기 핸들러
   */
  const handleBack = () => {
    navigate(-1);
  };

  /**
   * 홈 버튼 핸들러
   */
  const handleHomeClick = () => {
    navigate("/");
  };

  /**
   * 주소 복사 핸들러
   * @param address - 복사할 주소
   * @param type - 주소 타입 (도로명/지번)
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

  /**
   * 카카오맵 로드 및 표시
   */
  useEffect(() => {
    if (!restaurant) return;

    // 카카오맵 스크립트 로드
    const loadKakaoMap = () => {
      const kakaoAppKey = import.meta.env.VITE_KAKAO_MAP_APP_KEY;

      if (!kakaoAppKey || kakaoAppKey === "YOUR_KAKAO_MAP_APP_KEY") {
        console.warn(
          "⚠️ 카카오맵 API 키가 설정되지 않았습니다. .env 파일에 VITE_KAKAO_MAP_APP_KEY를 설정해주세요."
        );
        return;
      }

      const script = document.createElement("script");
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoAppKey}&autoload=false&libraries=services`;
      script.async = true;
      script.onload = () => {
        window.kakao.maps.load(() => {
          initializeMap();
        });
      };
      document.head.appendChild(script);
    };

    // 지도 초기화
    const initializeMap = () => {
      const container = document.getElementById("kakao-map");
      if (!container) return;

      const options = {
        center: new window.kakao.maps.LatLng(37.4979, 127.0276), // 기본 좌표 (강남역)
        level: 3,
      };

      const map = new window.kakao.maps.Map(container, options);

      // 주소-좌표 변환 객체 생성
      const geocoder = new window.kakao.maps.services.Geocoder();

      // 주소로 좌표 검색
      geocoder.addressSearch(restaurant.address, (result: any, status: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);

          // 지도 중심을 결과값으로 이동
          map.setCenter(coords);

          // 마커 생성
          const marker = new window.kakao.maps.Marker({
            map: map,
            position: coords,
          });

          // 인포윈도우 생성
          const infowindow = new window.kakao.maps.InfoWindow({
            content: `<div style="padding:5px;font-size:12px;font-weight:bold;">${restaurant.name}</div>`,
          });
          infowindow.open(map, marker);

          setMapLoaded(true);
        }
      });
    };

    // 카카오맵 스크립트가 이미 로드되어 있는지 확인
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => {
        initializeMap();
      });
    } else {
      loadKakaoMap();
    }
  }, [restaurant]);

  return (
    <div className="min-h-screen flex justify-center bg-body">
      {/* 메인 콘텐츠 컨테이너 - AppLayout과 동일한 제한 */}
      <div className="relative w-full min-w-[320px] sm:max-w-[640px] bg-white shadow-sm min-h-screen">
        {/* 상단 네비바 - simple 타입 (이미지 위에 겹침) */}
        <div className="absolute top-0 left-0 right-0 z-50">
          <TopNavBar
            variant="simple"
            onBack={handleBack}
            onHomeClick={handleHomeClick}
            onSearchClick={handleSearchClick}
          />
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="relative min-h-screen">
          {/* 로딩 상태 */}
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {/* 에러 상태 */}
          {error && !isLoading && (
            <div className="p-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                <p className="text-red-600 mb-3">{error}</p>
                <button
                  onClick={handleBack}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                >
                  돌아가기
                </button>
              </div>
            </div>
          )}

          {/* 식당 정보 */}
          {!isLoading && !error && restaurant && (
            <div className="relative">
              {/* 식당 이미지 - 네비바 영역까지 전체 */}
              {restaurant.image && restaurant.image.length > 0 && (
                <div className="w-full h-80 bg-gray-200">
                  <img
                    src={restaurant.image[0]}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "";
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* 식당 상세 정보 - 이미지 위에 겹치기, 상단 라운드 */}
              {/* 식당 기본 정보 섹션 */}
              <div className="relative -mt-8 bg-white rounded-t-lg px-6 pt-6 pb-8 space-y-4 z-10">
                {/* 지역 | 카테고리 */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{extractDong(restaurant.address) || "역삼동"}</span>
                  <span>|</span>
                  <span>
                    {restaurant.category3 ||
                      restaurant.category2 ||
                      restaurant.category1}
                  </span>
                </div>

                {/* 식당 이름 + 공유버튼 */}
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-2xl font-bold text-gray-900 flex-1">
                    {restaurant.name}
                  </h1>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="공유"
                  >
                    <Share2 className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* 카카오 별점 */}
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-lg font-semibold">
                    {restaurant.kakao_rating.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({restaurant.kakao_review_cnt}개 리뷰)
                  </span>
                </div>

                {/* Summary */}
                {restaurant.kakao_summary && (
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">
                      {restaurant.kakao_summary.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      {restaurant.kakao_summary.summary}
                    </p>
                  </div>
                )}

                {/* 구분선 */}
                <hr className="border-gray-200" />

                {/* 상세 정보 */}
                <div className="space-y-3">
                  {/* 영업 상태 */}
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            isOpenNow(restaurant.hours)
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {isOpenNow(restaurant.hours) ? "영업중" : "영업종료"}
                        </span>
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
                                handleCopyAddress(
                                  restaurant.address_lot,
                                  "지번"
                                )
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

              {/* 메뉴 섹션 */}
              {restaurant.menu && restaurant.menu.length > 0 && (
                <div className="bg-white px-6 py-6 space-y-4 border-t-16 border-neutral-100">
                  {/* 섹션 헤더 */}
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">메뉴</h2>
                  </div>

                  {/* 메뉴 리스트 */}
                  <div className="space-y-3">
                    {restaurant.menu.map((menuItem, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between p-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-light text-gray-700">
                              {menuItem.name}
                            </p>
                            {/* 추천 메뉴 배지 */}
                            {/* {menuItem.is_recommend && (
                              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-semibold">
                                추천
                              </span>
                            )} */}
                          </div>
                        </div>
                        <p className="font-semibold text-gray-900 flex-shrink-0">
                          {menuItem.price.toLocaleString()}원
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 위치 섹션 */}
              <div className="bg-white px-6 pt-6 space-y-4 border-t-16 border-neutral-100">
                {/* 섹션 헤더 */}
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-700" />
                  <h2 className="text-lg font-bold text-gray-900">위치</h2>
                </div>

                {/* 카카오맵 지도 */}
                <div
                  id="kakao-map"
                  className="w-full h-64 rounded-lg overflow-hidden border border-gray-200"
                ></div>

                {/* 주소 정보 (참고용) */}
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <p>{restaurant.address}</p>
                  {restaurant.address_lot && (
                    <p className="text-xs text-gray-500 mt-1">
                      지번: {restaurant.address_lot}
                    </p>
                  )}
                </div>

                {/* 카카오맵 링크 버튼 */}
                {restaurant.kakao_url && (
                  <a
                    href={restaurant.kakao_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    카카오맵에서 자세히 보기
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
