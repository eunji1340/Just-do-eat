/**
 * HTTP 클라이언트 (axios 기반)
 * - 공통 설정: 베이스 URL, 타임아웃, 인증 토큰 자동 첨부
 * - 401 자동 리프레시 (single-flight 패턴)
 * - 개발 모드 요청 로깅
 *
 * @example
 * // 기본 사용
 * const response = await httpClient.get('/restaurants');
 *
 * // 인증 불필요한 요청
 * const response = await httpClient({ url: '/public', meta: { authRequired: false } });
 */

import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";

/* ----- 타입 정의 ----- */

/**
 * 요청별 메타 옵션
 * @property authRequired - 인증 토큰 필요 여부 (기본값: true)
 */
export type MetaOptions = {
  authRequired?: boolean;
};

/* ----- 유틸리티 함수 ----- */

/**
 * 쿠키 값 읽기
 * @param name - 쿠키 이름
 * @returns 쿠키 값 또는 null
 */
function getCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}

/* ----- 리프레시 설정 ----- */

/** 토큰 갱신 엔드포인트 */
const REFRESH_URL = "/auth/reissue";

/** 401 자동 리프레시 활성화 여부 (현재: 비활성화) */
const REFRESH_ENABLED = false;

/* ----- axios 인스턴스 생성 ----- */

/**
 * axios 기본 인스턴스
 * - baseURL: 환경변수 또는 localhost:8080
 * - timeout: 5초
 * - withCredentials: 쿠키 자동 전송
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  timeout: 5000,
  withCredentials: true,
});

/* ----- 토큰 리프레시 큐 (single-flight 패턴) ----- */

/**
 * 토큰 갱신 중 여부
 * - 동시 다발적인 401 발생 시 리프레시 API 중복 호출 방지
 */
let isRefreshing = false;

/**
 * 리프레시 대기 큐
 * - 리프레시 완료 시 대기 중인 요청들에게 새 토큰 전달
 */
let waitQueue: Array<{
  resolve: (t: string) => void;
  reject: (e: unknown) => void;
}> = [];

/** 대기 큐에 요청 추가 */
function subscribe(resolve: (t: string) => void, reject: (e: unknown) => void) {
  waitQueue.push({ resolve, reject });
}

/** 리프레시 성공 시 대기 중인 모든 요청에 새 토큰 전달 */
function publishSuccess(token: string) {
  waitQueue.forEach(({ resolve }) => resolve(token));
  waitQueue = [];
}

/** 리프레시 실패 시 대기 중인 모든 요청 실패 처리 */
function publishError(err: unknown) {
  waitQueue.forEach(({ reject }) => reject(err));
  waitQueue = [];
}

/* ----- 요청 인터셉터 ----- */

/**
 * 요청 전처리
 * 1. 인증 토큰 자동 첨부 (authRequired !== false일 때)
 * 2. FormData 요청 시 Content-Type 자동 설정
 * 3. 개발 모드 요청 로깅
 */
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  const meta = (config as any).__meta as MetaOptions | undefined;

  // 1. 인증 토큰 첨부
  if (token && meta?.authRequired !== false) {
    config.headers = config.headers ?? {};
    (
      config.headers as Record<string, string>
    ).Authorization = `Bearer ${token}`;
  }

  // 2. FormData 처리 (Content-Type 자동 설정 위해 제거)
  if (config.data instanceof FormData) {
    if (config.headers) {
      delete (config.headers as Record<string, unknown>)["Content-Type"];
      delete (config.headers as Record<string, unknown>)["content-type"];
    }
  }

  // 3. 개발 모드 로깅
  if (config.baseURL && config.url) {
    console.log("[REQ]", new URL(config.url, config.baseURL).toString());
  }

  return config;
});

/* ----- 응답 인터셉터 ----- */

/**
 * 응답 후처리 및 에러 핸들링
 * - 성공 시: 그대로 반환
 * - 401 에러 시: 토큰 자동 갱신 후 재시도 (REFRESH_ENABLED일 때)
 */
axiosInstance.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalReq = error.config as AxiosRequestConfig & {
      __retry?: boolean;
    };

    // 에러 타입 체크
    if (!error.response) throw error;          // 네트워크 에러
    if (originalReq?.__retry) throw error;     // 재시도 실패
    if (error.response.status !== 401) throw error;  // 401 아닌 에러

    // 리프레시 비활성화 시 토큰 제거 후 종료
    if (!REFRESH_ENABLED) {
      localStorage.removeItem("accessToken");
      throw error;
    }

    // 이미 리프레시 중이면 대기 큐에 추가
    if (isRefreshing) {
      const newAT = await new Promise<string>((resolve, reject) =>
        subscribe(resolve, reject)
      );
      originalReq!.headers = {
        ...(originalReq!.headers ?? {}),
        Authorization: `Bearer ${newAT}`,
      };
      originalReq!.__retry = true;
      return axiosInstance(originalReq!);
    }

    // 토큰 갱신 시작
    isRefreshing = true;
    try {
      const csrf = getCookie("csrf");
      const refreshResp = await axiosInstance.request({
        method: "POST",
        url: REFRESH_URL,
        __meta: { authRequired: false },
        headers: csrf ? { "X-CSRF-Token": csrf } : {},
      } as any);

      const newAccessToken = (refreshResp.data as any)?.accessToken;
      if (!newAccessToken)
        throw new Error("No accessToken in refresh response");

      // 새 토큰 저장 및 대기 큐 처리
      localStorage.setItem("accessToken", newAccessToken);
      publishSuccess(newAccessToken);

      // 원래 요청 재시도
      originalReq!.headers = {
        ...(originalReq!.headers ?? {}),
        Authorization: `Bearer ${newAccessToken}`,
      };
      originalReq!.__retry = true;
      return axiosInstance(originalReq!);
    } catch (err) {
      publishError(err);
      localStorage.removeItem("accessToken");
      throw err;
    } finally {
      isRefreshing = false;
    }
  }
);

/* ----- 커스텀 래퍼 함수 ----- */

/**
 * 확장된 axios 설정 타입
 * @property meta - 요청별 메타 옵션 (authRequired 등)
 */
export type CustomAxiosRequestConfig = AxiosRequestConfig & {
  meta?: MetaOptions;
};

/**
 * 메타 옵션을 지원하는 axios 래퍼
 * - meta.authRequired로 인증 토큰 필요 여부 제어
 *
 * @example
 * httpClient({ url: '/restaurants', meta: { authRequired: false } })
 */
function customAxios<T = any>(config: CustomAxiosRequestConfig) {
  const { meta, ...rest } = config;
  return axiosInstance({
    ...rest,
    __meta: meta, // 내부에서만 쓰는 키 (인터셉터에서 사용)
  } as any) as Promise<T>;
}

/* axios 기본 메서드 추가 (get, post, put, delete, patch, request) */
(customAxios as any).get = axiosInstance.get;
(customAxios as any).post = axiosInstance.post;
(customAxios as any).put = axiosInstance.put;
(customAxios as any).delete = axiosInstance.delete;
(customAxios as any).patch   = axiosInstance.patch.bind(axiosInstance);
(customAxios as any).request = axiosInstance.request.bind(axiosInstance);

/**
 * 기본 내보내기: axios 인스턴스 + 커스텀 기능
 * @example
 * import httpClient from '@/shared/api/http'
 * const response = await httpClient.get('/restaurants')
 */
export default customAxios as typeof customAxios & AxiosInstance;

/* ----- 쿼리 스트링 유틸 ----- */

/**
 * 쿼리 파라미터 문자열 생성
 * - undefined, null, 빈 문자열 자동 제거
 * - 배열, 숫자, 불리언 지원
 *
 * @example
 * buildQueryString({ query: "치킨", page: 0, tag: undefined })
 * // => "query=치킨&page=0"
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    // undefined, null, 빈 문자열 제거
    if (value === undefined || value === null || value === "") {
      return;
    }

    // 배열 처리
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") {
          searchParams.append(key, String(item));
        }
      });
      return;
    }

    // 숫자, 불리언, 문자열
    searchParams.append(key, String(value));
  });

  return searchParams.toString();
}
