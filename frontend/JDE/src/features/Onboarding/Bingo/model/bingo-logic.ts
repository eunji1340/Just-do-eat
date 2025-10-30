// --------------------------------------------
// features/Onboarding/Bingo/model/bingo-logic.ts
// --------------------------------------------
import * as React from 'react';
import type { Tri, TagPrefs } from './bingo-types';
import { BINGO_5x5, TAG_WEIGHTS } from './bingo-data';

export function useBingoTriState() {
  // index → -1(싫어요), 0(건너뜀), 1(좋아요)
  const [state, setState] = React.useState<Record<number, Tri>>({});
  const cycle = (idx: number) => setState((s) => ({ ...s, [idx]: ((s[idx] ?? 0) === 1 ? -1 : (s[idx] ?? 0) + 1) as Tri }));
  const set = (idx: number, v: Tri) => setState((s) => ({ ...s, [idx]: v }));
  const reset = () => setState({});
  return { state, cycle, set, reset } as const;
}

// 클라이언트 계산: 태그 선호도(0~1) 산출
export function computeTagPrefsClient(state: Record<number, Tri>): TagPrefs {
  const accum: Record<string, number> = {};
  const denom: Record<string, number> = {}; // 가능한 최대합(정규화용)

  BINGO_5x5.forEach((item, idx) => {
    const vote = state[idx] ?? 0; // -1 / 0 / 1
    const weights = TAG_WEIGHTS[item.id] || {};
    for (const [tag, w] of Object.entries(weights)) {
      accum[tag] = (accum[tag] ?? 0) + vote * (w as number);
      denom[tag] = (denom[tag] ?? 0) + Math.abs(w as number); // 최대 절대합
    }
  });

  const prefs: TagPrefs = {};
  for (const [tag, sum] of Object.entries(accum)) {
    const maxAbs = denom[tag] || 1;
    // [-maxAbs, +maxAbs] → [0,1]로 선형 매핑
    const normalized = (sum + maxAbs) / (2 * maxAbs);
    if (normalized >= 0.1) prefs[tag as keyof TagPrefs] = +normalized.toFixed(3);
  }
  return prefs;
}

// 서버 계산: POST → { tag_prefs: Record<Tag, number> }
export async function computeTagPrefsServer(endpoint: string, payload: { responses: Array<{ id: string; vote: Tri }> }) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Bingo compute failed: ${res.status}`);
  return (await res.json()) as { tag_prefs: TagPrefs };
}
