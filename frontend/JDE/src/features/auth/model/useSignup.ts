import { useState, useCallback, useRef, useEffect } from "react";
import type { AxiosError, AxiosResponse } from "axios";
import { useUserStore } from "@/entities/user/model/user-store";
import customAxios from "@/shared/api/http";
import { getUserMe } from "@/features/user/api/getUserMe";

type AgeGroup = "TEENS" | "TWENTIES" | "THIRTIES" | "FORTIES" | "FIFTIES_PLUS";
type Gender = "MALE" | "FEMALE" | "OTHER";

export function useSignup() {
  const { onboardingSessionId } = useUserStore();

  const [formData, setFormData] = useState({
    name: "",
    password: "",
    passwordConfirm: "",
    imageUrl: null as string | null,
    ageGroup: "TWENTIES" as AgeGroup,
    gender: "MALE" as Gender,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameCheck, setNameCheck] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ checking: false, available: null, message: "" });

  // previewUrl 변경 시 ref 동기화
  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "name") {
      setNameCheck({ checking: false, available: null, message: "" });
    }
  };

  const setNameCheckResult = useCallback(
    (result: {
      checking: boolean;
      available: boolean | null;
      message: string;
    }) => {
      setNameCheck(result);
    },
    []
  );

  const handleImageSelect = useCallback((file: File | null) => {
    // 이미지 제거
    if (file === null) {
      const currentPreviewUrl = previewUrlRef.current;
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
      setPreviewUrl(null);
      setSelectedImageFile(null);
      setFormData((prev) => ({ ...prev, imageUrl: null }));
      return;
    }

    // 로컬 미리보기 세팅
    const blobUrl = URL.createObjectURL(file);
    setPreviewUrl(blobUrl);
    setSelectedImageFile(file);
  }, []);

  // 프로필 이미지 업로드 함수
  const uploadProfileImage = async (file: File): Promise<void> => {
    // 1. presigned URL 요청 (인증 필요)
    const presignResponse = (await customAxios({
      method: "POST",
      url: "/files/profile/presign",
      data: {
        fileName: file.name,
        contentType: file.type,
      },
      meta: { authRequired: true },
    })) as any;

    if (
      presignResponse?.data?.status !== "OK" ||
      !presignResponse?.data?.data
    ) {
      throw new Error("Presigned URL 발급에 실패했습니다.");
    }

    const { uploadUrl, publicUrl, headers } = presignResponse.data.data;

    // 2. S3에 파일 업로드
    try {
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
          ...(headers || {}),
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        // CORS 오류인 경우 특별 처리
        if (uploadResponse.status === 0 || uploadResponse.status === 403) {
          throw new Error(
            "S3 업로드 중 CORS 오류가 발생했습니다. 백엔드에서 S3 CORS 설정을 확인해주세요."
          );
        }
        throw new Error(
          `이미지 업로드에 실패했습니다. (${uploadResponse.status})`
        );
      }
    } catch (fetchError) {
      // CORS 오류 또는 네트워크 오류
      if (
        fetchError instanceof TypeError &&
        fetchError.message.includes("fetch")
      ) {
        throw new Error(
          "S3 업로드 중 네트워크 오류가 발생했습니다. 백엔드에서 S3 CORS 설정을 확인해주세요."
        );
      }
      throw fetchError;
    }

    // 3. PATCH /users/me/image로 이미지 URL 저장 (인증 필요)
    await customAxios({
      method: "PATCH",
      url: "/users/me/image",
      data: {
        imageUrl: publicUrl,
      },
      meta: { authRequired: true },
    });

    // 4. users/me를 다시 호출하여 새로운 유효한 S3 URL 받아오기
    await getUserMe();
  };

  const handleSubmit = async (
    e: React.FormEvent
  ): Promise<{ success: boolean; accessToken: string | null }> => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (formData.password !== formData.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      setSubmitting(false);
      return { success: false, accessToken: null };
    }

    if (formData.password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      setSubmitting(false);
      return { success: false, accessToken: null };
    }

    if (nameCheck.available === false) {
      setError("사용할 수 없는 아이디입니다.");
      setSubmitting(false);
      return { success: false, accessToken: null };
    }

    if (nameCheck.checking) {
      setError("아이디 중복 확인 중입니다. 잠시 후 다시 시도해주세요.");
      setSubmitting(false);
      return { success: false, accessToken: null };
    }

    // 아이디 형식 검증 (한글/영문만 허용)
    const isValidFormat = /^[가-힣a-zA-Z]+$/.test(formData.name);
    if (!isValidFormat || formData.name.length === 0) {
      setError("아이디는 한글 또는 영문만 사용할 수 있습니다.");
      setSubmitting(false);
      return { success: false, accessToken: null };
    }

    try {
      const payload: {
        name: string;
        password: string;
        imageUrl: string | null;
        ageGroup: string;
        gender: string;
        sessionId?: string;
      } = {
        name: formData.name,
        password: formData.password,
        imageUrl: formData.imageUrl,
        ageGroup: formData.ageGroup,
        gender: formData.gender,
      };

      if (onboardingSessionId) {
        payload.sessionId = onboardingSessionId;
      }

      // 회원가입 시에는 이미지 URL을 보내지 않음 (회원가입 후 업로드)
      payload.imageUrl = null;

      const response = await customAxios<
        AxiosResponse<{
          status: string;
          message?: string;
          data?: { accessToken?: string; refreshToken?: string };
        }>
      >({
        method: "POST",
        url: "/auth/signup",
        data: payload,
        meta: { authRequired: false },
      });

      if (response?.data?.status === "CREATED") {
        // 회원가입 성공 후 자동 로그인
        try {
          const loginResponse = await customAxios<
            AxiosResponse<{
              status: string;
              message?: string;
              data?: { accessToken?: string; refreshToken?: string };
            }>
          >({
            method: "POST",
            url: "/auth/login",
            data: {
              name: formData.name,
              password: formData.password,
            },
            meta: { authRequired: false },
          });

          if (
            loginResponse?.data?.status === "OK" &&
            loginResponse?.data?.data
          ) {
            // 토큰 저장
            if (loginResponse.data.data.accessToken) {
              localStorage.setItem(
                "accessToken",
                loginResponse.data.data.accessToken
              );
            }
            if (loginResponse.data.data.refreshToken) {
              localStorage.setItem(
                "refreshToken",
                loginResponse.data.data.refreshToken
              );
            }

            // 이미지가 있으면 바로 업로드
            if (selectedImageFile) {
              try {
                await uploadProfileImage(selectedImageFile);
              } catch (imageError) {
                console.error("프로필 이미지 업로드 실패:", imageError);
                // 이미지 업로드 실패해도 회원가입은 성공으로 처리
              }
            }

            return {
              success: true,
              accessToken: loginResponse.data.data.accessToken || null,
            };
          }
        } catch (loginError) {
          console.error("자동 로그인 실패:", loginError);
          // 로그인 실패해도 회원가입은 성공으로 처리
        }
        return { success: true, accessToken: null };
      } else {
        throw new Error(response?.data?.message || "회원가입에 실패했습니다.");
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message ??
        axiosError.message ??
        "회원가입 중 오류가 발생했습니다.";
      setError(errorMessage);
      return { success: false, accessToken: null };
    } finally {
      setSubmitting(false);
    }
  };

  return {
    formData,
    previewUrl,
    handleChange,
    handleImageSelect,
    submitting,
    error,
    handleSubmit,
    setNameCheckResult,
  };
}
