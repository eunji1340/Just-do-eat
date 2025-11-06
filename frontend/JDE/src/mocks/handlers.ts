// src/mocks/handlers.ts
import { http, HttpResponse, delay } from 'msw';

// === MukbtiTest 데이터/타입 가져오기 ===
// 경로 별칭(@)이 없으면 상대경로로 바꿔주세요.
import {
  MUKBTI_QUESTIONS,
  MUKBTI_TYPES,
} from './model/mukbti-data';
import type {
  Question,
  MukbtiAnswer,
  Axis,
} from './model/mukbti-types';

// === Bingo 데이터/타입 가져오기 ===
import {
  BINGO_5x5,
  TAG_WEIGHTS,
} from './model/bingo-data';
import type {
  Tri,
  Tag,
  ItemWeights,
  TagPrefs,
} from './model/bingo-types';

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
// 공통 핸들러 함수
// ----------------------------------------------------
// 비회원 온보딩 세션 발급 핸들러 함수 (공통)
const handleOnboardingSession = async () => {
  await delay(200);
  
  // UUID 형식의 세션 ID 생성
  const sessionId = crypto.randomUUID();
  
  return HttpResponse.json({
    status: 'OK',
    code: 'OK',
    message: '성공',
    data: {
      sessionId: sessionId,
    },
  });
};

// 아이디 중복 확인 핸들러 함수 (공통)
const handleUserIdExists = async ({ request }: { request: Request }) => {
  await delay(300);
  
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  
  if (!userId) {
    return HttpResponse.json(
      {
        status: 'BAD_REQUEST',
        code: 'VALIDATION_ERROR',
        message: '아이디를 입력해주세요.',
        data: false,
      },
      { status: 400 }
    );
  }

  // 간단한 중복 체크 (모킹)
  // 'existing_user', 'test', 'admin', 'demo_user_01' 등은 중복으로 처리
  const existingUsers = ['existing_user', 'test', 'admin', 'demo_user_01'];
  const exists = existingUsers.includes(userId);

  // boolean 값을 직접 반환 (true = 중복됨, false = 사용 가능)
  return HttpResponse.json({
    status: 'OK',
    code: 'OK',
    message: '성공',
    data: exists,  // boolean 직접 반환
  });
};

// 회원가입 핸들러 함수 (공통)
const handleSignup = async ({ request }: { request: Request }) => {
  const body = (await request.json()) as {
    userId?: string;
    password?: string;
    imageUrl?: string | null;
    ageGroup?: string;
    gender?: string;
    sessionId?: string;
  };

  await delay(500);

  // 유효성 검사
  if (!body.userId || !body.password) {
    return HttpResponse.json(
      {
        status: 'BAD_REQUEST',
        code: 'VALIDATION_ERROR',
        message: '아이디와 비밀번호는 필수입니다.',
        data: null,
      },
      { status: 400 }
    );
  }

  // userId 중복 체크
  if (body.userId === 'existing_user' || body.userId === 'test' || body.userId === 'admin') {
    return HttpResponse.json(
      {
        status: 'CONFLICT',
        code: 'USER_ALREADY_EXISTS',
        message: '이미 존재하는 아이디입니다.',
        data: null,
      },
      { status: 409 }
    );
  }

  // 세션 ID가 있으면 로그 출력 (디버깅용)
  if (body.sessionId) {
    console.log('[Mock] 회원가입 시 세션 ID 포함:', body.sessionId);
  }

  // 성공
  return HttpResponse.json({
    status: 'CREATED',
    code: 'CREATED',
    message: '회원가입 성공',
    data: null,
  });
};

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

          // 확장된 결과 정보 가져오기
      const fullMeta = MUKBTI_TYPES[mukbtiResult.code];
      const extendedResult = fullMeta ? {
        ...mukbtiResult,
        nickname: fullMeta.nickname,
        keywords: fullMeta.keywords,
        goodMatch: fullMeta.goodMatch,
        badMatch: fullMeta.badMatch,
        imagePath: fullMeta.imagePath,
      } : mukbtiResult;

    return HttpResponse.json({
      success: true,
      typeId: mukbtiResult.code,
      mukbtiResult: extendedResult,
      tagPrefs: tagPrefsResult.tag_prefs, // 중첩 구조 제거
    });
  }),

  // 4) 결과 유형 조회: GET /api/onboarding/result/types/:typeId
  http.get('/api/onboarding/result/types/:typeId', async ({ params }) => {
    const { typeId } = params;
    await delay(150);

    const meta = MUKBTI_TYPES[typeId as string] ?? { 
      label: '알 수 없는 유형',
      nickname: '알 수 없는 유형',
      keywords: [],
      description: '유형 정보를 찾을 수 없습니다.',
      goodMatch: [],
      badMatch: [],
      imagePath: '',
    };

    return HttpResponse.json({
      code: typeId,
      label: meta.label,
      nickname: meta.nickname,
      keywords: meta.keywords,
      description: meta.description,
      goodMatch: meta.goodMatch,
      badMatch: meta.badMatch,
      imagePath: meta.imagePath,
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

  // === 새로 추가: 비회원 온보딩 세션 발급 ===
  // 상대 경로 핸들러 (fetch 사용 시)
  http.post('/onboarding/session', handleOnboardingSession),
  
  // 절대 URL 핸들러 (customAxios baseURL 사용 시)
  http.post('http://localhost:8080/onboarding/session', handleOnboardingSession),

  // === 새로 추가: 아이디 중복 확인 ===
  // 상대 경로 핸들러 (fetch 사용 시)
  http.get('/users/exists', handleUserIdExists),
  
  // 절대 URL 핸들러 (customAxios baseURL 사용 시)
  http.get('http://localhost:8080/users/exists', handleUserIdExists),

  // === 수정: 회원가입 (응답 형식 변경: result → data) ===
  // 상대 경로 핸들러 (fetch 사용 시)
  http.post('/auth/signup', handleSignup),
  
  // 절대 URL 핸들러 (customAxios baseURL 사용 시)
  http.post('http://localhost:8080/auth/signup', handleSignup),

  // === 기존 유지: 회원가입 (fetch 사용 시 /api/ 접두사) ===
  // POST /api/auth/signup
  http.post('/api/auth/signup', async ({ request }) => {
    const body = (await request.json()) as {
      userId?: string;
      password?: string;
      imageUrl?: string | null;
      ageGroup?: string;
      gender?: string;
      sessionId?: string;
    };

    await delay(500);

    // 유효성 검사
    if (!body.userId || !body.password) {
      return HttpResponse.json(
        {
          status: 'BAD_REQUEST',
          code: 'VALIDATION_ERROR',
          message: '아이디와 비밀번호는 필수입니다.',
          data: null,
        },
        { status: 400 }
      );
    }

    // userId 중복 체크
    if (body.userId === 'existing_user' || body.userId === 'test' || body.userId === 'admin') {
      return HttpResponse.json(
        {
          status: 'CONFLICT',
          code: 'USER_ALREADY_EXISTS',
          message: '이미 존재하는 아이디입니다.',
          data: null,
        },
        { status: 409 }
      );
    }

    // 세션 ID가 있으면 로그 출력 (디버깅용)
    if (body.sessionId) {
      console.log('[Mock] 회원가입 시 세션 ID 포함:', body.sessionId);
    }

    // 성공
    return HttpResponse.json({
      status: 'CREATED',
      code: 'CREATED',
      message: '회원가입 성공',
      data: null,
    });
  }),

  // === 기존 유지: 로그인 (응답 형식은 result 사용, 명세서에 맞춤) ===
  // POST /api/auth/login
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as {
      userId?: string;
      password?: string;
    };

    await delay(300);

    // 유효성 검사
    if (!body.userId || !body.password) {
      return HttpResponse.json(
        {
          status: 'BAD_REQUEST',
          code: 'VALIDATION_ERROR',
          message: '아이디와 비밀번호를 입력해주세요.',
          result: null,
        },
        { status: 400 }
      );
    }

    // 간단한 인증 로직 (모킹)
    if (body.userId === 'demo_user_01' && body.password === 'DemoPassw0rd!') {
      return HttpResponse.json({
        status: 'OK',
        code: 'OK',
        message: '로그인 성공',
        result: {
          accessToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzYxNzA0MTE5LCJleHAiOjE3NjE3MDc3MTl9.q4MglaS3t6kmpvQyLcTtLqGuSV5gCkMNO8aadz99t-E',
          refreshToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzYxNzA0MTE5LCJleHAiOjE3NjI5MTM3MTl9.i9LvL7Zwst__nfv-fVq9BIHcchp8qT4k5-iJtTx000o',
        },
      });
    }

    // 인증 실패
    return HttpResponse.json(
      {
        status: 'UNAUTHORIZED',
        code: 'INVALID_CREDENTIALS',
        message: '아이디 또는 비밀번호가 일치하지 않습니다.',
        result: null,
      },
      { status: 401 }
    );
  }),

  // === 추가: 로그인 (customAxios 사용 시 /auth/login) ===
  // POST /auth/login
  http.post('/auth/login', async ({ request }) => {
    const body = (await request.json()) as {
      userId?: string;
      password?: string;
    };

    await delay(300);

    // 유효성 검사
    if (!body.userId || !body.password) {
      return HttpResponse.json(
        {
          status: 'BAD_REQUEST',
          code: 'VALIDATION_ERROR',
          message: '아이디와 비밀번호를 입력해주세요.',
          result: null,
        },
        { status: 400 }
      );
    }

    // 간단한 인증 로직 (모킹)
    if (body.userId === 'demo_user_01' && body.password === 'DemoPassw0rd!') {
      return HttpResponse.json({
        status: 'OK',
        code: 'OK',
        message: '로그인 성공',
        result: {
          accessToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzYxNzA0MTE5LCJleHAiOjE3NjE3MDc3MTl9.q4MglaS3t6kmpvQyLcTtLqGuSV5gCkMNO8aadz99t-E',
          refreshToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzYxNzA0MTE5LCJleHAiOjE3NjI5MTM3MTl9.i9LvL7Zwst__nfv-fVq9BIHcchp8qT4k5-iJtTx000o',
        },
      });
    }

    // 인증 실패
    return HttpResponse.json(
      {
        status: 'UNAUTHORIZED',
        code: 'INVALID_CREDENTIALS',
        message: '아이디 또는 비밀번호가 일치하지 않습니다.',
        result: null,
      },
      { status: 401 }
    );
  }),
];
