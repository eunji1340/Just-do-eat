// src/app/router.tsx
// 목적: 앱 라우팅 정의 (단일 책임: 라우팅)
// 교체 포인트: 라우터 전환 시 여기만 수정 (ex. Remix, TanStack Router)

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AppLayout from '../layout/AppLayout'
import MainPage from '../../pages/main/MainPage'
import RecommendPage from '../../pages/recommend/RecommendPage'
const router = createBrowserRouter([
  { 
    path: '/',
    element:
    <AppLayout>
      <MainPage /> 
    </AppLayout>
  },
  { 
    path: '/swipe',
    element:
    <AppLayout>
      <RecommendPage /> 
    </AppLayout>
  },

])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
