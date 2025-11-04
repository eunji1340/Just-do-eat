// src/app/router.tsx
// 목적: 앱 라우팅 정의 (단일 책임: 라우팅)
// 교체 포인트: 라우터 전환 시 여기만 수정 (ex. Remix, TanStack Router)

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AppLayout from '../layout/AppLayout'
import MainPage from '../../pages/main/MainPage'
import SwipePage from '../../pages/swipe/SwipePage'
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
      <SwipePage /> 
    </AppLayout>
  },

])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
