// src/pages/restaurant/ui/RestaurantLocation.tsx
// 목적: 식당 위치 섹션 (카카오맵 + 주소)

import { useEffect } from "react";
import { ExternalLink } from "lucide-react";
import type { RestaurantDetailResponse } from "../api/useRestaurantDetail";

// 전역 타입 선언
declare global {
  interface Window {
    kakao: any;
  }
}

interface RestaurantLocationProps {
  restaurant: RestaurantDetailResponse;
}

/**
 * 식당 위치 컴포넌트
 * - 카카오맵 지도
 * - 주소 정보
 * - 카카오맵 링크
 */
export default function RestaurantLocation({
  restaurant,
}: RestaurantLocationProps) {
  // 카카오맵 로드 및 표시
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
    <div className="bg-white p-6 space-y-4">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-gray-900">위치</h2>
      </div>

      {/* 카카오맵 지도 */}
      <div
        id="kakao-map"
        className="w-full h-64 rounded-lg overflow-hidden"
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
  );
}
