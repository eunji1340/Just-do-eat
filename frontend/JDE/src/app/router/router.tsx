// src/app/router/router.tsx
// 목적: 앱 라우팅 정의 (단일 책임: 라우팅)
// 교체 포인트: 라우터 전환 시 여기만 수정 (ex. Remix, TanStack Router)

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppLayout from '../layout/AppLayout';
import MainPage from '../../pages/main/MainPage';
import OnboardingLanding from '../../pages/Onboarding/landing';
import OnboardingPage from '../../pages/Onboarding';
import OnboardingResult from '../../pages/Onboarding/result';
import SignupPage from '../../pages/Signup';
import LoginPage from '../../pages/Login';

const router = createBrowserRouter([
  { 
    path: '/',
    element: (
      <AppLayout>
        <MainPage /> 
      </AppLayout>
    ),
  },
  {
    path: '/onboarding/landing',
    element: <OnboardingLanding />,
  },
  {
    path: '/onboarding/test',
    element: <OnboardingPage />,
  },
  {
    path: '/onboarding/result',
    element: <OnboardingResult />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
