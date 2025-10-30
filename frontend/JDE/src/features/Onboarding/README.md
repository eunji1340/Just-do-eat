# 온보딩 기능 구조 설명

## 📁 폴더 구조

```
Onboarding/
├── Bingo/
│   ├── model/           # 타입 정의 및 MSW 전용 데이터
│   │   ├── bingo-data.ts      # ⚠️ MSW 전용 - UI에서 직접 사용 금지
│   │   ├── bingo-logic.ts     # ⚠️ 사용 안 함 (UI로 이동 완료)
│   │   └── bingo-types.ts     # ✅ 타입 정의만 (UI에서 import 가능)
│   └── ui/              # UI 컴포넌트
│       ├── bingo-board.tsx
│       └── bingo-flow.tsx
└── MukbtiTest/
    ├── model/           # 타입 정의 및 MSW 전용 데이터
    │   ├── mukbti-data.ts     # ⚠️ MSW 전용 - UI에서 직접 사용 금지
    │   ├── mukbti-logic.ts    # ⚠️ 사용 안 함 (UI로 이동 완료)
    │   └── types.tsx          # ✅ 타입 정의만 (UI에서 import 가능)
    └── ui/              # UI 컴포넌트
        ├── mukbti-flow.tsx
        └── mukbti-question.tsx
```

---

## 🎯 설계 원칙

### ✅ UI 컴포넌트는 백엔드 API 데이터만 사용

**프론트엔드 책임:**
- 백엔드에서 받은 데이터를 화면에 표시
- 사용자 입력을 수집하여 백엔드로 전송
- UI 상태 관리 (로딩, 에러, 진행 상태 등)

**프론트엔드가 알지 못하는 것:**
- 질문의 실제 내용 (백엔드에서 제공)
- 빙고 문항의 실제 내용 (백엔드에서 제공)
- MBTI 계산 로직 (백엔드에서 처리)
- 태그 선호도 계산 로직 (백엔드에서 처리)

---

## 📂 model 폴더의 역할

### 1. **타입 정의 (Type Definitions)** ✅

**UI에서 사용 가능:**
```tsx
// ✅ 좋은 예: 타입만 import
import type { Question, MukbtiAnswer } from '../model/types';
import type { Tri, BingoItem } from '../model/bingo-types';
```

**파일:**
- `types.tsx` - MukBTI 관련 타입
- `bingo-types.ts` - 빙고 관련 타입

---

### 2. **MSW 모킹용 데이터** ⚠️

**UI에서 사용 금지! MSW handlers에서만 사용:**
```tsx
// ❌ 나쁜 예: UI에서 직접 데이터 import
import { MUKBTI_QUESTIONS } from '../model/mukbti-data';
import { BINGO_5x5 } from '../model/bingo-data';

// ✅ 좋은 예: MSW handlers에서만 사용
// src/mocks/handlers.ts에서만 import
```

**파일:**
- `mukbti-data.ts` - 질문 데이터, MBTI 유형 정의 (MSW 전용)
- `bingo-data.ts` - 빙고 문항, 태그 가중치 (MSW 전용)

---

### 3. **로직 함수** ⚠️

**더 이상 사용하지 않음 (UI로 이동 완료):**
```tsx
// ❌ 사용 안 함
export function useMukbtiFlow() { ... }
export function useBingoTriState() { ... }
export function computeMukbtiClient() { ... }
export function computeTagPrefsClient() { ... }
```

**이유:**
- 백엔드 API로 대체되었음
- UI 컴포넌트 내부로 이동 (필요한 경우)
- model 폴더는 데이터 저장소가 아님

---

## 🔄 데이터 흐름

### MukBTI 흐름:
```
1. UI 마운트
   ↓
2. GET /api/onboarding/mbtis
   ← 백엔드에서 질문 데이터 받기
   ↓
3. 사용자 답변 수집
   ↓
4. POST /api/onboarding/import
   → 답변 데이터 전송
   ← MBTI 결과 받기
```

### 빙고 흐름:
```
1. UI 마운트
   ↓
2. GET /api/onboarding/bingo
   ← 백엔드에서 빙고 문항 받기
   ↓
3. 사용자 선호도 수집
   ↓
4. POST /api/onboarding/import
   → 선호도 데이터 전송
   ← 태그 선호도 결과 받기
```

---

## 📝 UI 컴포넌트 구조

### `mukbti-flow.tsx`
```tsx
// ✅ 타입만 import
import type { Question, MukbtiAnswer } from '../model/types';

export default function MukbtiFlow() {
  // 백엔드에서 질문 데이터 로드
  const [questions, setQuestions] = useState<Question[]>([]);
  
  useEffect(() => {
    fetch('/api/onboarding/mbtis')
      .then(res => res.json())
      .then(data => setQuestions(data.items));
  }, []);
  
  // UI 상태 관리 (인라인)
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = questions[currentIndex];
  const progress = Math.round(((currentIndex + 1) / questions.length) * 100);
  
  // ... 나머지 로직
}
```

### `bingo-flow.tsx`
```tsx
// ✅ 타입만 import
import type { Tri, BingoItem } from '../model/bingo-types';

export default function BingoFlow() {
  // 백엔드에서 빙고 데이터 로드
  const [bingoItems, setBingoItems] = useState<BingoItem[]>([]);
  
  useEffect(() => {
    fetch('/api/onboarding/bingo')
      .then(res => res.json())
      .then(data => setBingoItems(data.items));
  }, []);
  
  // UI 상태 관리 (인라인)
  const [state, setState] = useState<Record<number, Tri>>({});
  const set = (idx: number, v: Tri) => setState(s => ({ ...s, [idx]: v }));
  
  // ... 나머지 로직
}
```

---

## 🚫 안티패턴 (하지 말 것)

### ❌ UI에서 하드코딩된 데이터 사용
```tsx
// ❌ 나쁜 예
import { MUKBTI_QUESTIONS } from '../model/mukbti-data';

function MyComponent() {
  return <div>{MUKBTI_QUESTIONS[0].text}</div>;
}
```

### ❌ UI에서 계산 로직 직접 구현
```tsx
// ❌ 나쁜 예
function calculateMBTI(answers: MukbtiAnswer[]) {
  // 백엔드에서 해야 할 일
  const axisScore = { M: 0, N: 0, ... };
  // ...
}
```

---

## ✅ 올바른 패턴

### ✅ 백엔드 API 호출
```tsx
// ✅ 좋은 예
useEffect(() => {
  fetch('/api/onboarding/mbtis')
    .then(res => res.json())
    .then(data => setQuestions(data.items));
}, []);
```

### ✅ 타입만 import
```tsx
// ✅ 좋은 예
import type { Question } from '../model/types';

const [questions, setQuestions] = useState<Question[]>([]);
```

---

## 🔧 개발 환경

### MSW (Mock Service Worker)
개발 중에는 MSW가 백엔드 API를 모킹합니다:
- `src/mocks/handlers.ts` - API 엔드포인트 정의
- `src/mocks/browser.ts` - MSW 초기화
- `public/mockServiceWorker.js` - Service Worker 스크립트

### 실제 백엔드 연결
MSW를 비활성화하면 실제 백엔드 API로 요청이 전송됩니다:
```tsx
// src/main.tsx
if (import.meta.env.DEV) {
  // 개발 환경에서만 MSW 활성화
  const { initMsw } = await import('./mocks/browser');
  await initMsw();
}
```

---

## 📞 질문?

구조 또는 패턴에 대한 질문이 있으면 팀에게 문의하세요!

**작성일:** 2024-01-30  
**업데이트:** model 폴더 용도 명확화, UI 컴포넌트 독립성 강화

