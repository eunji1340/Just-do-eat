// src/app/router/router.tsx
// 목적: 앱 라우팅 정의 (단일 책임: 라우팅)
// 교체 포인트: 라우터 전환 시 여기만 수정 (ex. Remix, TanStack Router)

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import MainPage from "../../pages/main/MainPage";
import SwipePage from "../../pages/swipe/SwipePage";
import OnboardingLanding from "../../pages/Onboarding/landing";
import OnboardingPage from "../../pages/Onboarding";
import OnboardingResult from "../../pages/Onboarding/result";
import SignupPage from "../../pages/Signup";
import LoginPage from "../../pages/Login";
import GroupsListPage from "@/pages/groups/GroupsListPage";
import GroupDetailPage from "@/pages/groups/GroupDetailPage";
import RoulettePage from "@/pages/roulette/RoulettePage";
import SearchStartPage from "@/pages/search/SearchStartPage";
import SearchResultPage from "@/pages/search/SearchResultPage";
import PlanDetailPage from "@/pages/plan/PlanDetailPage";
import FavoritesPage from "@/pages/favorites/FavoritesPage";
import RestaurantDetailPage from "@/pages/restaurant/RestaurantDetailPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AppLayout>
        <MainPage />
      </AppLayout>
    ),
  },
  {
    path: "/swipe",
    element: (
      <AppLayout>
        <SwipePage />
      </AppLayout>
    ),
  },
  {
    path: "/onboarding/landing",
    element: <OnboardingLanding />,
  },
  {
    path: "/onboarding/test",
    element: <OnboardingPage />,
  },
  {
    path: "/onboarding/result",
    element: <OnboardingResult />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/groups",
    element: (
      <AppLayout>
        <GroupsListPage />
      </AppLayout>
    ),
  },
  {
    path: "/groups/:groupId",
    element: (
      <AppLayout>
        <GroupDetailPage />
      </AppLayout>
    ),
  },
  {
    path: "/roulette",
    element: (
      <AppLayout>
        <RoulettePage />
      </AppLayout>
    ),
  },
  {
    path: "/plans/:planId",
    element: (
      <AppLayout>
        <PlanDetailPage />
      </AppLayout>
    ),
  },
  {
    path: "/search/start",
    element: <SearchStartPage />,
  },
  {
    path: "/search",
    element: (
      <AppLayout>
        <SearchResultPage />
      </AppLayout>
    ),
  },
  {
    path: "/favorites",
    element: (
      <AppLayout>
        <FavoritesPage />
      </AppLayout>
    ),
  },
  {
    path: "/restaurants/:restaurantId",
    element: <RestaurantDetailPage />,
  },
]);

export default function AppRouter() {
  return (
    <RouterProvider router={router} future={{ v7_startTransition: true }} />
  );
}
