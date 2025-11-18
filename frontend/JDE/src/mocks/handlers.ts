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
import { resolvePlanDetailSample } from './model/plan-detail.sample';

// ----------------------------------------------------
// Mock 사용자 정보 저장소 (메모리)
// ----------------------------------------------------
let mockUserStore: {
  userId: number;
  name: string;
  imageUrl: string | null;
  ageGroup: string;
  gender: string;
  role: string;
} | null = null;

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
  const name = url.searchParams.get('name');

  if (!name) {
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
  const exists = existingUsers.includes(name);

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
    name?: string;
    password?: string;
    imageUrl?: string | null;
    ageGroup?: string;
    gender?: string;
    sessionId?: string;
  };

  await delay(500);

  // 유효성 검사
  if (!body.name || !body.password) {
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
  if (body.name === 'existing_user' || body.name === 'test' || body.name === 'admin') {
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

  // 사용자 정보 저장 (회원가입 시)
  mockUserStore = {
    userId: Date.now(), // 간단한 ID 생성
    name: body.name,
    imageUrl: null, // 회원가입 시에는 이미지가 없음 (나중에 업로드)
    ageGroup: body.ageGroup || 'TWENTIES',
    gender: body.gender || 'MALE',
    role: 'USER',
  };

  // 성공
  return HttpResponse.json({
    status: 'CREATED',
    code: 'CREATED',
    message: '회원가입 성공',
    data: null,
  });
};

// 프로필 이미지 presigned URL 발급 핸들러 함수 (공통)
const handleProfilePresign = async ({ request }: { request: Request }) => {
  await delay(300);
  
  const body = (await request.json()) as {
    fileName?: string;
    contentType?: string;
  };

  if (!body.fileName || !body.contentType) {
    return HttpResponse.json(
      {
        status: 'BAD_REQUEST',
        code: 'VALIDATION_ERROR',
        message: '파일명과 Content-Type은 필수입니다.',
        data: null,
      },
      { status: 400 }
    );
  }

  // Mock presigned URL 생성
  // 실제로는 S3 presigned URL이지만, 개발 환경에서는 mock URL 사용
  const fileExtension = body.fileName.split('.').pop() || 'jpg';
  const mockFileId = crypto.randomUUID();
  const mockUploadUrl = `https://justdoeat-jde.s3.amazonaws.com/u/mock/${mockFileId}.${fileExtension}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=mock&X-Amz-Date=${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z&X-Amz-Expires=300&X-Amz-SignedHeaders=host&X-Amz-Signature=mock`;
  const mockPublicUrl = `https://justdoeat-jde.s3.amazonaws.com/u/mock/${mockFileId}.${fileExtension}`;

  return HttpResponse.json({
    status: 'OK',
    code: '200',
    message: '요청 성공',
    data: {
      uploadUrl: mockUploadUrl,
      publicUrl: mockPublicUrl,
      headers: {
        'Content-Type': body.contentType,
      },
      expiresIn: 300,
    },
  });
};

// ----------------------------------------------------
// 핸들러 (customAxios 방식만 사용)
// ----------------------------------------------------
export const handlers = [
  // === 온보딩 관련 API ===
  
  // 1) 비회원 온보딩 세션 발급: POST http://localhost:8080/onboarding/session
  http.post('http://localhost:8080/onboarding/session', handleOnboardingSession),
  
  // 2) 먹BTI 문항 조회: GET http://localhost:8080/onboarding/mbtis
  http.get('http://localhost:8080/onboarding/mbtis', async () => {
    await delay(150);
    return HttpResponse.json({
      items: MUKBTI_QUESTIONS,
    });
  }),

  // 3) 빙고 문항 조회: GET http://localhost:8080/onboarding/bingo
  http.get('http://localhost:8080/onboarding/bingo', async () => {
    await delay(120);
    return HttpResponse.json({
      items: BINGO_5x5,
    });
  }),

  // 4) 온보딩 결과 반영: POST http://localhost:8080/onboarding/import
  http.post('http://localhost:8080/onboarding/import', async ({ request }) => {
    const body = (await request.json()) as {
      mukbtiAnswers?: MukbtiAnswer[];
      bingoResponses?: Array<{ id: string; vote: Tri }>;
      sessionId?: string;
    };

    await delay(300);

    if (body.sessionId) {
      console.log('[Mock] 온보딩 import 요청에 세션 ID 포함:', body.sessionId);
    }

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
      tagPrefs: tagPrefsResult.tag_prefs,
    });
  }),

  // 5) 결과 유형 조회: GET http://localhost:8080/onboarding/result/types/:typeId
  http.get('http://localhost:8080/onboarding/result/types/:typeId', async ({ params }) => {
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

  // === 약속 상세 ===
  http.get('http://localhost:8080/plans/:planId', async ({ params, request }) => {
    await delay(400);

    const url = new URL(request.url);
    if (url.searchParams.get('variant') === 'error') {
      return HttpResponse.json(
        { message: '약속 상세를 불러오지 못했습니다.' },
        { status: 500 },
      );
    }

    const planId = params.planId as string;
    const planDetail = resolvePlanDetailSample(planId);

    if (url.searchParams.get('variant') === 'empty') {
      planDetail.recommended = [];
    }

    return HttpResponse.json(planDetail);
  }),

  // === 약속 상세 ===
  http.get('http://localhost:8080/plans/:planId', async ({ params, request }) => {
    await delay(400);

    const url = new URL(request.url);
    if (url.searchParams.get('variant') === 'error') {
      return HttpResponse.json(
        { message: '약속 상세를 불러오지 못했습니다.' },
        { status: 500 },
      );
    }

    const planId = params.planId as string;
    const planDetail = resolvePlanDetailSample(planId);

    if (url.searchParams.get('variant') === 'empty') {
      planDetail.recommended = [];
    }

    return HttpResponse.json(planDetail);
  }),

  // === 인증 관련 API ===
  
  // 7) 아이디 중복 확인: GET http://localhost:8080/users/exists
  http.get('http://localhost:8080/users/exists', handleUserIdExists),

  // 8) 회원가입: POST http://localhost:8080/auth/signup
  http.post('http://localhost:8080/auth/signup', handleSignup),

  // 9) 로그인: POST http://localhost:8080/auth/login
  http.post('http://localhost:8080/auth/login', async ({ request }) => {
    const body = (await request.json()) as {
      name?: string;
      password?: string;
    };

    await delay(300);

    // 유효성 검사
    if (!body.name || !body.password) {
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
    if (body.name === 'demo_user_01' && body.password === 'DemoPassw0rd!') {
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

  // 10) 사용자 정보 조회: GET http://localhost:8080/users/me
  http.get('http://localhost:8080/users/me', async ({ request }) => {
    await delay(200);

    // Authorization 헤더 확인
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          status: 'UNAUTHORIZED',
          code: 'UNAUTHORIZED',
          message: '인증이 필요합니다.',
          result: null,
        },
        { status: 401 }
      );
    }

    // 저장된 사용자 정보가 있으면 반환, 없으면 기본값 반환
    const userData = mockUserStore || {
      userId: 1,
      name: 'demo_user_01',
      imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo_user_01',
      ageGroup: 'TWENTIES',
      gender: 'MALE',
      role: 'USER',
    };

    return HttpResponse.json({
      status: 'OK',
      code: '200',
      message: '요청 성공',
      data: {
        userId: userData.userId,
        name: userData.name,
        imageUrl: userData.imageUrl,
        ageGroup: userData.ageGroup,
        gender: userData.gender,
        role: userData.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        regionId: null,
        regionName: null,
      },
    });
  }),

  // 11) 로그아웃: POST http://localhost:8080/auth/logout
  http.post('http://localhost:8080/auth/logout', async ({ request }) => {
    await delay(200);

    // Authorization 헤더 확인 (선택적)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 로그아웃은 토큰 없어도 성공 처리 가능
      return HttpResponse.json({
        status: 'OK',
        code: 'OK',
        message: '로그아웃 성공',
        result: null,
      });
    }

    // 로그아웃 성공
    return HttpResponse.json({
      status: 'OK',
      code: 'OK',
      message: '로그아웃 성공',
      result: null,
    });
  }),

  // 12) 프로필 이미지 presigned URL 발급: POST http://localhost:8080/files/profile/presign
  http.post('http://localhost:8080/files/profile/presign', handleProfilePresign),

  // 13) 프로필 이미지 수정: PATCH http://localhost:8080/users/me/image
  http.patch('http://localhost:8080/users/me/image', async ({ request }) => {
    await delay(200);

    // Authorization 헤더 확인
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          status: 'UNAUTHORIZED',
          code: 'UNAUTHORIZED',
          message: '인증이 필요합니다.',
          data: null,
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      imageUrl?: string;
    };

    if (!body.imageUrl) {
      return HttpResponse.json(
        {
          status: 'BAD_REQUEST',
          code: 'VALIDATION_ERROR',
          message: 'imageUrl은 필수입니다.',
          data: null,
        },
        { status: 400 }
      );
    }

    // 사용자 정보 업데이트 (없으면 생성)
    if (!mockUserStore) {
      mockUserStore = {
        userId: 1,
        name: 'demo_user_01',
        imageUrl: body.imageUrl,
        ageGroup: 'TWENTIES',
        gender: 'MALE',
        role: 'USER',
      };
    } else {
      mockUserStore.imageUrl = body.imageUrl;
    }

    // 성공 응답
    return HttpResponse.json({
      status: 'OK',
      code: '200',
      message: '프로필 이미지가 업데이트되었습니다.',
      data: {
        imageUrl: body.imageUrl,
      },
    });
  }),

  // 14) 결정 도구 선택: POST http://localhost:8080/plans/:planId/tool
  http.post('http://localhost:8080/plans/:planId/tool', async ({ params, request }) => {
    await delay(300);

    // Authorization 헤더 확인
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          status: 'UNAUTHORIZED',
          code: 'UNAUTHORIZED',
          message: '인증이 필요합니다.',
          data: null,
        },
        { status: 401 }
      );
    }

    const planId = params.planId as string;
    const url = new URL(request.url);
    const toolType = url.searchParams.get('type') as 'VOTE' | 'LADDER' | 'ROULETTE' | null;
    const restaurantIds = (await request.json()) as number[];

    if (!toolType || !['VOTE', 'LADDER', 'ROULETTE'].includes(toolType)) {
      return HttpResponse.json(
        {
          status: 'BAD_REQUEST',
          code: 'VALIDATION_ERROR',
          message: '유효한 결정 도구 타입이 필요합니다. (VOTE, LADDER, ROULETTE)',
          data: null,
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(restaurantIds) || restaurantIds.length === 0) {
      return HttpResponse.json(
        {
          status: 'BAD_REQUEST',
          code: 'VALIDATION_ERROR',
          message: '식당 ID 배열이 필요합니다.',
          data: null,
        },
        { status: 400 }
      );
    }

    // 성공 응답
    return HttpResponse.json({
      status: '100 CONTINUE',
      code: '200',
      message: '결정 도구가 선택되었습니다.',
      data: {
        planId: parseInt(planId, 10),
        toolType: toolType,
        status: 'PENDING',
        finalRestaurantId: 0,
        startedAt: new Date().toISOString(),
        closedAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24시간 후
        createdBy: 1,
      },
    });
  }),
];
