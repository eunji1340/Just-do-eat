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

interface UserState {
  // 온보딩 산출물
  mukbtiAnswers: MukbtiAnswer[];
  mukbtiResult: MukbtiResult | null;
  bingoLikes: BingoLike[];
  tagPrefs: Record<string, number>; // 빙고 태그 선호도(0~1)
  
  // 온보딩 세션 ID (비회원 온보딩 정보 연결용)
  onboardingSessionId: string | null;

  // setters
  setMukbtiAnswers: (a: MukbtiAnswer[]) => void;
  setMukbtiResult: (r: MukbtiResult) => void;
  setBingoLikes: (b: BingoLike[]) => void;
  setTagPrefs: (p: Record<string, number>) => void;
  setOnboardingSessionId: (id: string | null) => void;
  resetOnboarding: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      mukbtiAnswers: [],
      mukbtiResult: null,
      bingoLikes: [],
      tagPrefs: {},
      onboardingSessionId: null,

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
    }),
    { name: 'user-store-v2' }
  )
);
