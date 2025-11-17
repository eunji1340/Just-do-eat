import { useState } from "react";
import type { AxiosError, AxiosResponse } from "axios";
import customAxios from "@/shared/api/http";

export type LoginResult = {
  accessToken?: string;
  refreshToken?: string;
};

type LoginApiResult = {
  accessToken?: string;
  refreshToken?: string;
};

type LoginApiResponse = {
  status: string;
  code?: string;
  message?: string;
  data?: LoginApiResult;
};

export function useLogin() {
  const [formData, setFormData] = useState({ name: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (
    e: React.FormEvent
  ): Promise<LoginResult | null> => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await customAxios<AxiosResponse<LoginApiResponse>>({
        method: "POST",
        url: "/auth/login",
        data: formData,
        meta: { authRequired: false },
      });

      const data = response.data;

      if (data.status !== "OK") {
        throw new Error(data.message || "로그인에 실패했습니다.");
      }

      const result: LoginResult = {};

      if (data.data?.accessToken) {
        localStorage.setItem("accessToken", data.data.accessToken);
        result.accessToken = data.data.accessToken;
      }
      if (data.data?.refreshToken) {
        localStorage.setItem("refreshToken", data.data.refreshToken);
        result.refreshToken = data.data.refreshToken;
      }

      return result;
    } catch (error) {
      const axiosError = error as AxiosError<{
        message?: string;
        status?: string;
        code?: string;
      }>;

      // 상태 코드에 따른 에러 메시지 처리
      let errorMessage = "로그인 중 오류가 발생했습니다.";

      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data;

        // 백엔드에서 제공한 메시지가 있으면 사용
        if (data?.message) {
          errorMessage = data.message;
        } else {
          // 상태 코드별 기본 메시지
          switch (status) {
            case 400:
              errorMessage = "아이디와 비밀번호를 입력해주세요.";
              break;
            case 401:
              errorMessage = "아이디 또는 비밀번호가 일치하지 않습니다.";
              break;
            case 404:
              errorMessage = "존재하지 않는 사용자입니다.";
              break;
            case 500:
              errorMessage =
                "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
              break;
            default:
              errorMessage = `로그인에 실패했습니다. (오류 코드: ${status})`;
          }
        }
      } else if (axiosError.message) {
        // 네트워크 에러 등
        if (axiosError.message.includes("timeout")) {
          errorMessage = "요청 시간이 초과되었습니다. 네트워크를 확인해주세요.";
        } else if (axiosError.message.includes("Network Error")) {
          errorMessage = "네트워크 오류가 발생했습니다. 연결을 확인해주세요.";
        } else {
          errorMessage = axiosError.message;
        }
      }

      setError(errorMessage);
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return { formData, handleChange, submitting, error, handleSubmit };
}
