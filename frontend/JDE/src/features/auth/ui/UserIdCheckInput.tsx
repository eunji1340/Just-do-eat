import React from "react";
import { useUserIdCheck } from "../model/useUserIdCheck";

interface UserIdCheckInputProps {
  userId: string;
  onChange: (value: string) => void;
  onCheckResult?: (result: {
    checking: boolean;
    available: boolean | null;
    message: string;
  }) => void;
}

export default function UserIdCheckInput({
  userId,
  onChange,
  onCheckResult,
}: UserIdCheckInputProps) {
  const { checking, available, message } = useUserIdCheck(userId);

  // 아이디 형식 검증 (한글/영문만 허용)
  const isValidFormat = (value: string): boolean => {
    if (value.length === 0) return true;
    // 한글(가-힣), 영문(a-z, A-Z)만 허용
    return /^[가-힣a-zA-Z]+$/.test(value);
  };

  const formatValid = isValidFormat(userId);
  const hasInvalidChars = userId.length > 0 && !formatValid;

  // 부모 컴포넌트에 결과 전달
  React.useEffect(() => {
    if (onCheckResult) {
      onCheckResult({ checking, available, message });
    }
  }, [checking, available, message, onCheckResult]);

  return (
    <div className="grid gap-2">
      <label
        htmlFor="userId"
        className="font-bold text-sm text-[var(--color-fg)]"
      >
        아이디 *
      </label>
      <input
        id="userId"
        type="text"
        value={userId}
        onChange={(e) => {
          const value = e.target.value;
          // 최대 10자까지만 입력 가능
          if (value.length <= 10) {
            onChange(value);
          }
        }}
        required
        maxLength={10}
        placeholder="최대 10자"
        className={`p-3.5 rounded-xl border transition-all ${
          hasInvalidChars || available === false
            ? "border-red-500 focus:ring-red-500"
            : available === true
            ? "border-green-500 focus:ring-green-500"
            : "border-[var(--color-border)] focus:ring-[var(--color-primary)]"
        } bg-[var(--color-bg)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-offset-0`}
      />
      {hasInvalidChars && (
        <p className="text-xs text-red-500 m-0 mt-1 font-medium">
          아이디는 한글 또는 영문만 사용할 수 있습니다.
        </p>
      )}
      {!hasInvalidChars && checking && (
        <p className="text-xs text-[var(--color-muted-fg)] m-0 mt-1 flex items-center gap-1">
          확인 중...
        </p>
      )}
      {!hasInvalidChars && !checking && available === false && (
        <p className="text-xs text-red-500 m-0 mt-1 font-medium">{message}</p>
      )}
      {!hasInvalidChars && !checking && available === true && (
        <p className="text-xs text-green-600 m-0 mt-1 font-medium">
          ✓ {message}
        </p>
      )}
    </div>
  );
}
