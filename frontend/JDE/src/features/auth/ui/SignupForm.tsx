import type { FormEvent } from "react";
import { useState, useEffect } from "react";
// 경로 오류 수정: "@/shared/ui/button" -> '../shared/ui/button' (임시 경로 가정)
import { Button } from "../../../shared/ui/button";
// 경로 오류 수정: "./UserIdCheckInput" -> './UserIdCheckInput' (현재 디렉토리)
import UserIdCheckInput from "./UserIdCheckInput";
// 경로 오류 수정: "@/widgets/onboarding/OnboardingSummary" -> '../../widgets/onboarding/OnboardingSummary' (임시 경로 가정)
import { OnboardingSummary } from "../../../widgets/onboarding/OnboardingSummary";

type AgeGroup = "TEENS" | "TWENTIES" | "THIRTIES" | "FORTIES" | "FIFTIES_PLUS";
type Gender = "MALE" | "FEMALE" | "OTHER";

interface SignupFormProps {
  formData: {
    name: string;
    password: string;
    passwordConfirm: string;
    imageUrl: string | null;
    ageGroup: AgeGroup;
    gender: Gender;
  };
  previewUrl: string | null;
  handleChange: (field: string, value: string) => void;
  handleImageSelect: (file: File | null) => void;
  submitting: boolean;
  error: string | null;
  handleSubmit: (e: FormEvent) => void;
  setNameCheckResult: (result: {
    checking: boolean;
    available: boolean | null;
    message: string;
  }) => void;
}

export default function SignupForm({
  formData,
  previewUrl,
  handleChange,
  handleImageSelect,
  submitting,
  error,
  handleSubmit,
  setNameCheckResult,
}: SignupFormProps) {
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null); // 비밀번호 일치 여부 실시간 확인

  useEffect(() => {
    if (!formData.passwordConfirm) {
      setPasswordMatch(null);
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setPasswordMatch(false);
    } else {
      setPasswordMatch(true);
    }
  }, [formData.password, formData.passwordConfirm]);

  return (
    <>
            <OnboardingSummary />     {" "}
      {/* 폼 요소에 좌우 패딩(px-4) 및 하단 패딩(pb-8) 추가하여 포커스 링 잘림 현상 해결 */}
           {" "}
      <form onSubmit={handleSubmit} className="grid gap-5 w-full min-w-0 pb-8">
               {" "}
        <UserIdCheckInput
          userId={formData.name}
          onChange={(value) => handleChange("name", value)}
          onCheckResult={setNameCheckResult}
        />
               {" "}
        <div className="grid gap-2">
                   {" "}
          <label
            htmlFor="password"
            className="font-bold text-sm text-[var(--color-fg)]"
          >
                        비밀번호 *          {" "}
          </label>
                   {" "}
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            required
            placeholder="8자 이상"
            className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
          />
                    {/* ===== 비밀번호 유효성 검사 문구 수정 시작 ===== */}     
             {" "}
          {formData.password && formData.password.length > 0 && (
            <p
              className={`text-xs mt-1 mb-0 font-medium ${
                formData.password.length < 8 ? "text-red-500" : "text-green-600"
              }`}
            >
              {formData.password.length < 8
                ? "비밀번호는 8자 이상이어야 합니다."
                : "사용 가능한 비밀번호 길이입니다."}
            </p>
          )}
                 {" "}
        </div>
               {" "}
        <div className="grid gap-2">
          <label
            htmlFor="passwordConfirm"
            className="font-bold text-sm text-[var(--color-fg)]"
          >
            비밀번호 확인 *
          </label>
          <div className="grid gap-0">
            <input
              id="passwordConfirm"
              type="password"
              value={formData.passwordConfirm}
              onChange={(e) => handleChange("passwordConfirm", e.target.value)}
              required
              placeholder="비밀번호 재입력"
              className={`p-3.5 rounded-xl border bg-[var(--color-bg)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 transition-all ${
                passwordMatch === false
                  ? "border-red-500 focus:ring-red-500"
                  : passwordMatch === true
                  ? "border-green-500 focus:ring-green-500"
                  : "border-[var(--color-border)] focus:ring-[var(--color-primary)]"
              }`}
            />
            {formData.passwordConfirm && (
              <p
                className={`text-xs mt-2 mb-0 font-medium ${
                  passwordMatch === false
                    ? "text-red-500"
                    : passwordMatch === true
                    ? "text-green-600"
                    : "text-[var(--color-muted-fg)]"
                }`}
              >
                {passwordMatch === false
                  ? "비밀번호가 일치하지 않습니다. 다시 확인해주세요."
                  : passwordMatch === true
                  ? "비밀번호가 일치합니다."
                  : ""}
              </p>
            )}
          </div>
        </div>
        <div className="grid gap-2 -mt-2">
          <label
            htmlFor="profileImage"
            className="font-bold text-sm text-[var(--color-fg)]"
          >
            프로필 이미지
          </label>
                   {" "}
          <input
            id="profileImage"
            type="file"
            accept="image/*"
            onChange={(event) =>
              handleImageSelect(event.target.files?.[0] ?? null)
            }
            className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
          />
                   {" "}
          {previewUrl || formData.imageUrl ? (
            <div className="flex items-center gap-3 mt-2">
                           {" "}
              <img
                src={previewUrl ?? formData.imageUrl ?? ""}
                alt="프로필 미리보기"
                className="w-16 h-16 rounded-full object-cover border-2 border-[var(--color-primary)] shadow-sm"
              />
                           {" "}
              <button
                type="button"
                onClick={() => handleImageSelect(null)}
                className="text-sm text-[var(--color-primary)] hover:underline font-medium"
              >
                                이미지 제거              {" "}
              </button>
                         {" "}
            </div>
          ) : (
            <span className="text-xs text-[var(--color-muted-fg)] mt-1">
                            선택된 이미지가 없습니다.            {" "}
            </span>
          )}
                 {" "}
        </div>
               {" "}
        <div className="grid gap-2">
                   {" "}
          <label
            htmlFor="ageGroup"
            className="font-bold text-sm text-[var(--color-fg)]"
          >
                        연령대 *          {" "}
          </label>
                   {" "}
          <select
            id="ageGroup"
            value={formData.ageGroup}
            onChange={(e) => handleChange("ageGroup", e.target.value)}
            className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
          >
                        <option value="TEENS">10대</option>           {" "}
            <option value="TWENTIES">20대</option>           {" "}
            <option value="THIRTIES">30대</option>           {" "}
            <option value="FORTIES">40대</option>           {" "}
            <option value="FIFTIES_PLUS">50대 이상</option>         {" "}
          </select>
                 {" "}
        </div>
               {" "}
        <div className="grid gap-2">
                   {" "}
          <label className="font-bold text-sm text-[var(--color-fg)]">
                        성별 *          {" "}
          </label>
                   {" "}
          <div className="flex gap-4 justify-center flex-wrap">
                       {" "}
            {(["MALE", "FEMALE", "OTHER"] as const).map((gender) => (
              <label
                key={gender}
                className="flex items-center gap-2 cursor-pointer flex-shrink-0 px-4 py-2 rounded-lg border-2 border-transparent hover:border-[var(--color-primary)]/30 transition-all"
              >
                               {" "}
                <input
                  type="radio"
                  name="gender"
                  value={gender}
                  checked={formData.gender === gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                  className="cursor-pointer w-4 h-4 text-[var(--color-primary)]"
                />
                               {" "}
                <span className="text-sm text-[var(--color-fg)] whitespace-nowrap font-medium">
                                   {" "}
                  {/* 이전 코드: gender === "MALE" ? "남성" ? "여성" : "기타" */}
                                   {" "}
                  {gender === "MALE"
                    ? "남성"
                    : gender === "FEMALE"
                    ? "여성"
                    : "기타"}
                                 {" "}
                </span>
                             {" "}
              </label>
            ))}
                     {" "}
          </div>
                 {" "}
        </div>
               {" "}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                        ⚠️ {error}         {" "}
          </div>
        )}
               {" "}
        <div className="overflow-visible">
          <Button
            type="submit"
            disabled={submitting}
            className={`
              p-4 rounded-xl border-0 text-base font-bold transition-all w-full shadow-md
              ${
                submitting
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-[var(--color-primary)] text-[var(--color-primary-fg)] hover:opacity-90 hover:shadow-lg cursor-pointer"
              }
            `}
          >
            {submitting ? "가입 중..." : "회원가입"}
          </Button>
        </div>
      </form>
         {" "}
    </>
  );
}
