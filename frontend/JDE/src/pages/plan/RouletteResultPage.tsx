// src/pages/plan/RouletteResultPage.tsx

import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { Restaurant } from "@/entities/restaurant/types";
import { TopNavBar } from "@/widgets/top-navbar";

type LocationState = {
  restaurant?: Restaurant;
};

export default function RouletteResultPage() {
  const navigate = useNavigate();
  const { planId = "" } = useParams<{ planId: string }>();
  const location = useLocation();
  const state = location.state as LocationState | undefined;
  const restaurant = state?.restaurant;

  if (!restaurant) {
    return (
      <>
        <TopNavBar
          variant="label"
          label="결정 결과"
          onBack={() => navigate(-1)}
        />
        <main className="min-h-dvh flex flex-col items-center justify-center gap-3 px-4">
          <p className="text-sm text-neutral-600 text-center">
            선택된 식당 정보를 불러올 수 없습니다.
            <br />
            다시 약속 상세 페이지에서 시도해주세요.
          </p>
          <button
            onClick={() => navigate(`/plans/${planId}`)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            약속 상세로 돌아가기
          </button>
        </main>
      </>
    );
  }

  // 🔹 대표 이미지 (첫 번째 이미지)
  const mainImage = restaurant.image?.[0];

  return (
    <>
      <TopNavBar
        variant="label"
        label="오늘의 식당"
        onBack={() => navigate(`/plans/${planId}`)}
      />
      <main className="min-h-dvh bg-neutral-100 px-4 py-6">
        <section className="mx-auto max-w-md rounded-2xl bg-white p-5 shadow-md">
          {/* ✅ 이미지 렌더링 */}
          {mainImage && (
            <div className="mb-4 overflow-hidden rounded-2xl">
              <img
                src={mainImage}
                alt={restaurant.name}
                className="h-48 w-full object-cover"
              />
            </div>
          )}

          <p className="text-xs font-medium text-primary mb-2">
            오늘의 모임 장소
          </p>
          <h1 className="text-2xl font-bold text-neutral-900">
            {restaurant.name}
          </h1>

          {restaurant.category && (
            <p className="mt-1 text-sm text-neutral-500">
              {restaurant.category}
            </p>
          )}

          {restaurant.address && (
            <p className="mt-3 text-sm text-neutral-700">
              {restaurant.address}
            </p>
          )}

          {/* 필요하면 요약, 평점, 가격대 등 추가 */}
          {/* <p className="mt-2 text-sm text-neutral-700">
            {restaurant.summary}
          </p> */}

          <button
            onClick={() => navigate(`/plans/${planId}`)}
            className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white"
          >
            약속 상세로 돌아가기
          </button>
        </section>
      </main>
    </>
  );
}
