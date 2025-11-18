import { useState, useEffect } from "react";
import type { AxiosError, AxiosResponse } from "axios";
import customAxios from "@/shared/api/http";

type ExistsResponse = {
  status: string;
  code?: string;
  message?: string;
  data?: boolean;
};

export function useUserIdCheck(name: string) {
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // 빈 문자열이면 체크하지 않음
    if (!name || name.length === 0) {
      setChecking(false);
      setAvailable(null);
      setMessage("");
      return;
    }

    // 최대 10자까지만 체크
    if (name.length > 10) {
      setChecking(false);
      setAvailable(null);
      setMessage("");
      return;
    }

    // 딜레이를 300ms로 줄여서 더 빠르게 반응
    const timer = setTimeout(() => {
      checkUserId(name);
    }, 300);

    return () => clearTimeout(timer);
  }, [name]);

  const checkUserId = async (value: string) => {
    setChecking(true);
    setMessage("확인 중...");

    try {
      const response = await customAxios<AxiosResponse<ExistsResponse>>({
        method: "GET",
        url: `/users/exists?name=${encodeURIComponent(value)}`,
        meta: { authRequired: false },
      });

      const exists = response.data?.data ?? false;

      setAvailable(!exists);
      setMessage(
        exists ? "이미 사용 중인 아이디입니다." : "사용 가능한 아이디입니다."
      );
    } catch (error) {
      const axiosError = error as AxiosError<ExistsResponse>;
      const errorData = axiosError.response?.data;
      if (
        errorData?.code === "NOT_FOUND" ||
        axiosError.response?.status === 404
      ) {
        setAvailable(true);
        setMessage("사용 가능한 아이디입니다.");
      } else {
        setAvailable(null);
        setMessage("중복 확인에 실패했습니다.");
      }
    } finally {
      setChecking(false);
    }
  };

  return { checking, available, message };
}
