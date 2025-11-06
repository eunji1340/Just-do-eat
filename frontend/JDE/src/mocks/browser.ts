// src/mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// export된 worker (원하면 테스트에서도 재사용 가능)
export const worker = setupWorker(...handlers);

// 앱 시작 시 호출할 초기화 함수
export async function initMsw() {
  // 환경 변수로 MSW 활성화 여부 제어
  if (import.meta.env.VITE_USE_MSW === 'false') {
    return; // MSW 비활성화
  }

  // Vite 기준: 개발 환경에서만 시작
  if (import.meta.env.DEV) {
    await worker.start({
      onUnhandledRequest: 'bypass', // 정의 안 된 요청은 통과
      serviceWorker: {
        // 기본은 '/mockServiceWorker.js'; 루트가 다르면 여기서 경로 설정
      },
    });
    // console.info('[MSW] worker started');
  }
}
