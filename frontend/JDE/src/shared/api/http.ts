/**
 * axios 인스턴스(+401 자동 리프레시 single-flight) - 단순화 버전
 */

import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";

/** 메타 옵션 */
export type MetaOptions = {
  authRequired?: boolean;
};

/** 쿠키 읽기 */
function getCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}

/** 리프레시 관련 상수 */
const REFRESH_URL = "/auth/reissue";
const REFRESH_ENABLED = false;

/** axios 기본 인스턴스 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL || "http://k13a701.p.ssafy.io/api",
  timeout: 5000,
  withCredentials: true,
});

/* ----- single-flight ----- */
let isRefreshing = false;
let waitQueue: Array<{
  resolve: (t: string) => void;
  reject: (e: unknown) => void;
}> = [];

function subscribe(resolve: (t: string) => void, reject: (e: unknown) => void) {
  waitQueue.push({ resolve, reject });
}
function publishSuccess(token: string) {
  waitQueue.forEach(({ resolve }) => resolve(token));
  waitQueue = [];
}
function publishError(err: unknown) {
  waitQueue.forEach(({ reject }) => reject(err));
  waitQueue = [];
}

/* 요청 인터셉터 */
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  const meta = (config as any).__meta as MetaOptions | undefined;

  if (token && meta?.authRequired !== false) {
    config.headers = config.headers ?? {};
    (
      config.headers as Record<string, string>
    ).Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    if (config.headers) {
      delete (config.headers as Record<string, unknown>)["Content-Type"];
      delete (config.headers as Record<string, unknown>)["content-type"];
    }
  }

  if (config.baseURL && config.url) {
    // 최종 URL 콘솔 확인
    console.log("[REQ]", new URL(config.url, config.baseURL).toString());
  }

  return config;
});

/* 응답 인터셉터 */
axiosInstance.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalReq = error.config as AxiosRequestConfig & {
      __retry?: boolean;
    };

    if (!error.response) throw error;
    if (originalReq?.__retry) throw error;
    if (error.response.status !== 401) throw error;

    if (!REFRESH_ENABLED) {
      localStorage.removeItem("accessToken");
      throw error;
    }

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

      localStorage.setItem("accessToken", newAccessToken);
      publishSuccess(newAccessToken);

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

/* ----- 래퍼 함수 ----- */
export type CustomAxiosRequestConfig = AxiosRequestConfig & {
  meta?: MetaOptions;
};

function customAxios<T = any>(config: CustomAxiosRequestConfig) {
  const { meta, ...rest } = config;
  return axiosInstance({
    ...rest,
    __meta: meta, // 내부에서만 쓰는 키
  } as any) as Promise<T>;
}

/* axiosInstance의 메서드 얹기 */
(customAxios as any).get = axiosInstance.get;
(customAxios as any).post = axiosInstance.post;
(customAxios as any).put = axiosInstance.put;
(customAxios as any).delete = axiosInstance.delete;
(customAxios as any).patch   = axiosInstance.patch.bind(axiosInstance);
(customAxios as any).request = axiosInstance.request.bind(axiosInstance);

export default customAxios as typeof customAxios & AxiosInstance;
