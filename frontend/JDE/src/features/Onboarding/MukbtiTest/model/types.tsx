// ---------------------------------------------
// features/Onboarding/MukbtiTest/model/types.ts
// ---------------------------------------------
export type Axis = 'M' | 'N' | 'P' | 'Q' | 'S' | 'A' | 'T' | 'D';


export type Choice = {
id: string;
text: string;
// 이 선택이 기여하는 축(들). 예: ['M', 'P'] → M/P에 +1
axes?: Axis[];
};


export type Question = {
id: string;
text: string;
choices: Choice[];
};


export type MukbtiAnswer = { qid: string; choiceId: string };


export type MukbtiResult = {
code: string; // 예: 'MPST'
label: string; // 예: '현실파 점심헌터'
description: string;
};