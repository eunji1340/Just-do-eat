import { Routes, Route, Navigate } from 'react-router-dom';
import OnboardingLanding from './pages/Onboarding/landing';
import OnboardingPage from './pages/Onboarding';
import OnboardingResult from './pages/Onboarding/result';
import SignupPage from './pages/Signup';
import LoginPage from './pages/Login';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/onboarding/landing" replace />} />
      <Route path="/onboarding/landing" element={<OnboardingLanding />} />
      <Route path="/onboarding/test" element={<OnboardingPage />} />
      <Route path="/onboarding/result" element={<OnboardingResult />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}
