import { Routes, Route, Navigate } from 'react-router-dom';
import OnboardingLanding from './pages/Onboarding/landing';
import OnboardingPage from './pages/Onboarding';
import OnboardingResult from './pages/Onboarding/result';
import SignupPage from './pages/Signup';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/onboarding/landing" replace />} />
      <Route path="/onboarding/landing" element={<OnboardingLanding />} />
      <Route path="/onboarding/test" element={<OnboardingPage />} />
      <Route path="/onboarding/result" element={<OnboardingResult />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<div style={{ padding: '20px', textAlign: 'center' }}>로그인 페이지 (준비중)</div>} />
    </Routes>
  );
}
