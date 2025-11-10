// =============================================
// src/entities/user/model/user.store.ts
// =============================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MukbtiAnswer = { qid: string; choiceId: string };
export type MukbtiResult = { 
  code: string; 
  label: string; 
  description: string;
  nickname?: string;
  keywords?: string[];
  goodMatch?: string[];
  badMatch?: string[];
};
export type BingoLike = { item: string; liked: boolean };

// 로그인한 사용자 정보 타입
export type UserInfo = {
  memberId: number;
  userId: string;
  imageUrl: string;
  ageGroup: string;
  gender: string;
  role: string;
};

interface UserState {
  // 로그인한 사용자 정보
  user: UserInfo | null;
  isAuthenticated: boolean;
  
  // 온보딩 산출물
  mukbtiAnswers: MukbtiAnswer[];
  mukbtiResult: MukbtiResult | null;
  bingoLikes: BingoLike[];
  tagPrefs: Record<string, number>; // 빙고 태그 선호도(0~1)
  
  // 온보딩 세션 ID (비회원 온보딩 정보 연결용)
  onboardingSessionId: string | null;

  // 사용자 정보 setters
  setUser: (user: UserInfo) => void;
  clearUser: () => void;
  
  // 온보딩 setters
  setMukbtiAnswers: (a: MukbtiAnswer[]) => void;
  setMukbtiResult: (r: MukbtiResult) => void;
  setBingoLikes: (b: BingoLike[]) => void;
  setTagPrefs: (p: Record<string, number>) => void;
  setOnboardingSessionId: (id: string | null) => void;
  resetOnboarding: () => void;
  
  // 전체 초기화 (로그아웃용)
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      // 사용자 정보 초기값
      user: null,
      isAuthenticated: false,
      
      // 온보딩 정보 초기값
      mukbtiAnswers: [],
      mukbtiResult: null,
      bingoLikes: [],
      tagPrefs: {},
      onboardingSessionId: null,

      // 사용자 정보 액션
      setUser: (user) => set({ user, isAuthenticated: true }),
      clearUser: () => set({ user: null, isAuthenticated: false }),

      // 온보딩 액션
      setMukbtiAnswers: (a) => set({ mukbtiAnswers: a }),
      setMukbtiResult: (r) => set({ mukbtiResult: r }),
      setBingoLikes: (b) => set({ bingoLikes: b }),
      setTagPrefs: (p) => set({ tagPrefs: p }),
      setOnboardingSessionId: (id) => set({ onboardingSessionId: id }),

      resetOnboarding: () => set({ 
        mukbtiAnswers: [], 
        mukbtiResult: null, 
        bingoLikes: [], 
        tagPrefs: {},
        onboardingSessionId: null
      }),
      
      // 로그아웃 (모든 정보 초기화)
      logout: () => set({ 
        user: null,
        isAuthenticated: false,
        mukbtiAnswers: [], 
        mukbtiResult: null, 
        bingoLikes: [], 
        tagPrefs: {},
        onboardingSessionId: null
      }),
    }),
    { name: 'user-store-v3' }
  )
);
