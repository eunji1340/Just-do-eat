import React from 'react';
import { useUserIdCheck } from '../model/useUserIdCheck';

interface UserIdCheckInputProps {
  userId: string;
  onChange: (value: string) => void;
  onCheckResult?: (result: { checking: boolean; available: boolean | null; message: string }) => void;
}

export default function UserIdCheckInput({ userId, onChange, onCheckResult }: UserIdCheckInputProps) {
  const { checking, available, message } = useUserIdCheck(userId);

  // 부모 컴포넌트에 결과 전달
  React.useEffect(() => {
    if (onCheckResult) {
      onCheckResult({ checking, available, message });
    }
  }, [checking, available, message, onCheckResult]);

  return (
    <div className="grid gap-2">
      <label htmlFor="userId" className="font-bold text-sm text-[var(--color-fg)]">
        아이디 *
      </label>
      <input
        id="userId"
        type="text"
        value={userId}
        onChange={(e) => onChange(e.target.value)}
        required
        placeholder="영문, 숫자 조합 (4-20자)"
        className={`p-3 rounded-lg border ${
          available === false 
            ? 'border-[var(--color-error)]' 
            : available === true 
            ? 'border-green-500' 
            : 'border-[var(--color-border)]'
        } bg-[var(--color-bg)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]`}
      />
      {checking && (
        <p className="text-sm text-[var(--color-muted)] m-0">확인 중...</p>
      )}
      {available === false && (
        <p className="text-sm text-[var(--color-error)] m-0">{message}</p>
      )}
      {available === true && (
        <p className="text-sm text-green-600 m-0">{message}</p>
      )}
    </div>
  );
}

