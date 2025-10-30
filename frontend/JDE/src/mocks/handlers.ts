// src/mocks/handlers.ts
import { http, HttpResponse, delay } from 'msw';

// === MukbtiTest 데이터/타입 가져오기 ===
// 경로 별칭(@)이 없으면 상대경로로 바꿔주세요.
import {
  MUKBTI_QUESTIONS,
  MUKBTI_TYPES,
} from '../features/Onboarding/MukbtiTest/model/mukbti-data';
import type {
  Question,
  MukbtiAnswer,
  Axis,
} from '../features/Onboarding/MukbtiTest/model/types';

// === Bingo 데이터/타입 가져오기 ===
import {
  BINGO_5x5,
  TAG_WEIGHTS,
} from '../features/Onboarding/Bingo/model/bingo-data';
import type {
  Tri,
  Tag,
  ItemWeights,
  TagPrefs,
} from '../features/Onboarding/Bingo/model/bingo-types';

// ----------------------------------------------------
// 유틸: MBTI 서버 계산 (클라와 동일 로직, 서버에 있다고 가정)
// ----------------------------------------------------
function computeMukbtiServerSide(
  questions: Question[],
  answers: MukbtiAnswer[],
) {
  const axisScore: Record<Axis, number> = {
    M: 0, N: 0, P: 0, Q: 0, S: 0, A: 0, T: 0, D: 0,
  };
  const byId = new Map(questions.map((q) => [q.id, q] as const));

  for (const a of answers) {
    const q = byId.get(a.qid);
    const c = q?.choices.find((c) => c.id === a.choiceId);
    (c?.axes ?? []).forEach((ax) => { axisScore[ax] += 1; });
  }

  const code =
    (axisScore.M >= axisScore.N ? 'M' : 'N') +
    (axisScore.P >= axisScore.Q ? 'P' : 'Q') +
    (axisScore.S >= axisScore.A ? 'S' : 'A') +
    (axisScore.T >= axisScore.D ? 'T' : 'D');

  const meta = MUKBTI_TYPES[code] ?? { label: code, description: '커스텀 유형' };
  return { code, label: meta.label, description: meta.description };
}

// ----------------------------------------------------
// 유틸: 태그 선호도 서버 계산 (0~1 정규화, 0.1 미만 drop)
// ----------------------------------------------------
function computeTagPrefsServerSide(
  responses: Array<{ id: string; vote: Tri }>
): { tag_prefs: TagPrefs } {
  const accum: Partial<Record<Tag, number>> = {};
  const denom: Partial<Record<Tag, number>> = {};

  for (const { id, vote } of responses) {
    const weights = TAG_WEIGHTS[id] as ItemWeights | undefined;
    if (!weights) continue;

    for (const [tag, w] of Object.entries(weights)) {
      const t = tag as Tag;
      const weight = w ?? 0;
      accum[t] = (accum[t] ?? 0) + vote * weight;
      denom[t] = (denom[t] ?? 0) + Math.abs(weight);
    }
  }

  const prefs: TagPrefs = {};
  for (const [tag, sum] of Object.entries(accum)) {
    const t = tag as Tag;
    const maxAbs = denom[t] || 1;
    const normalized = (sum! + maxAbs) / (2 * maxAbs); // [-max,+max]→[0,1]
    if (normalized >= 0.1) prefs[t] = +normalized.toFixed(3);
  }
  return { tag_prefs: prefs };
}

// ----------------------------------------------------
// 핸들러
// ----------------------------------------------------
export const handlers = [
  // 1) 먹BTI 문항 조회: GET /api/onboarding/mbtis
  http.get('/api/onboarding/mbtis', async () => {
    await delay(150);
    return HttpResponse.json({
      items: MUKBTI_QUESTIONS,
    });
  }),

  // 2) 빙고 문항 조회: GET /api/onboarding/bingo
  http.get('/api/onboarding/bingo', async () => {
    await delay(120);
    return HttpResponse.json({
      items: BINGO_5x5,
    });
  }),

  // 3) 온보딩 결과 반영: POST /api/onboarding/import
  //    body: { mukbtiAnswers: MukbtiAnswer[], bingoResponses: Array<{ id: string; vote: Tri }> }
  http.post('/api/onboarding/import', async ({ request }) => {
    const body = (await request.json()) as {
      mukbtiAnswers?: MukbtiAnswer[];
      bingoResponses?: Array<{ id: string; vote: Tri }>;
    };

    await delay(300);

    // MBTI 결과 계산
    const mukbtiResult = computeMukbtiServerSide(MUKBTI_QUESTIONS, body.mukbtiAnswers ?? []);
    
    // 태그 선호도 계산
    const tagPrefsResult = computeTagPrefsServerSide(body.bingoResponses ?? []);

    return HttpResponse.json({
      success: true,
      typeId: mukbtiResult.code,
      mukbtiResult,
      tagPrefs: tagPrefsResult.tag_prefs, // 중첩 구조 제거
    });
  }),

  // 4) 결과 유형 조회: GET /api/onboarding/result/types/:typeId
  http.get('/api/onboarding/result/types/:typeId', async ({ params }) => {
    const { typeId } = params;
    await delay(150);

    const meta = MUKBTI_TYPES[typeId as string] ?? { 
      label: '알 수 없는 유형', 
      description: '유형 정보를 찾을 수 없습니다.' 
    };

    return HttpResponse.json({
      code: typeId,
      label: meta.label,
      description: meta.description,
    });
  }),

  // 5) 온보딩 결과 공유: POST /api/onboarding/share
  http.post('/api/onboarding/share', async ({ request }) => {
    const body = (await request.json()) as { typeId?: string };
    await delay(200);

    return HttpResponse.json({
      success: true,
      shareUrl: `https://example.com/share/${body.typeId}`,
      message: '카카오톡으로 공유되었습니다.',
    });
  }),
];
