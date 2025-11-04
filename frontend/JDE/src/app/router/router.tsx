// src/app/router.tsx
// 목적: 앱 라우팅 정의 (단일 책임: 라우팅)
// 교체 포인트: 라우터 전환 시 여기만 수정 (ex. Remix, TanStack Router)

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import MainPage from "../../pages/main/MainPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AppLayout>
        <MainPage />
      </AppLayout>
    ),
  },
]);

export default function AppRouter() {
  return (
    <RouterProvider
      router={router}
      // @ ts-expect-error - v7_startTransition은 v6.4+에서 지원되지만 타입 정의가 누락됨
      future={{ v7_startTransition: true }}
    />
  );
}
