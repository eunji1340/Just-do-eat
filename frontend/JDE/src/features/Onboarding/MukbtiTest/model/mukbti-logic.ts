// ------------------------------------------------
// features/Onboarding/MukbtiTest/model/mukbti-logic.ts
// ------------------------------------------------
import * as React from 'react';
import type { Question, MukbtiAnswer, Axis } from './types';
import { MUKBTI_TYPES } from './mukbti-data';

export function useMukbtiFlow(questions: Question[]) {
  const [index, setIndex] = React.useState(0);
  const current = questions[index];
  const isLast = index === questions.length - 1;
  const progress = Math.round(((index + 1) / questions.length) * 100);
  const goNext = () => setIndex((i) => Math.min(i + 1, questions.length - 1));
  const goPrev = () => setIndex((i) => Math.max(i - 1, 0));
  return { index, current, isLast, progress, goNext, goPrev } as const;
}

// 클라이언트 계산: 선택된 choice들의 axes를 집계하여 4축 코드 생성
export function computeMukbtiClient(questions: Question[], answers: MukbtiAnswer[]) {
  const axisScore: Record<Axis, number> = { M:0,N:0,P:0,Q:0,S:0,A:0,T:0,D:0 };
  const byId = new Map(questions.map(q => [q.id, q] as const));
  for (const a of answers) {
    const q = byId.get(a.qid);
    if (!q) continue;
    const c = q.choices.find(c => c.id === a.choiceId);
    (c?.axes ?? []).forEach(ax => { axisScore[ax] += 1; });
  }
  const code = (
    (axisScore.M >= axisScore.N ? 'M' : 'N') +
    (axisScore.P >= axisScore.Q ? 'P' : 'Q') +
    (axisScore.S >= axisScore.A ? 'S' : 'A') +
    (axisScore.T >= axisScore.D ? 'T' : 'D')
  );
  const meta = MUKBTI_TYPES[code] ?? { label: code, description: '커스텀 유형' };
  return { code, label: meta.label, description: meta.description };
}

// 서버 계산: POST → { code,label,description }
export async function computeMukbtiServer(endpoint: string, payload: { answers: MukbtiAnswer[] }) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`MukBTI compute failed: ${res.status}`);
  return (await res.json()) as { code: string; label: string; description: string };
}
