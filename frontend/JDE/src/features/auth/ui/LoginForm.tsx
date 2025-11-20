import type { FormEvent } from "react";
import { Button } from "@/shared/ui/button";

interface LoginFormProps {
  formData: { name: string; password: string };
  handleChange: (field: string, value: string) => void;
  submitting: boolean;
  error: string | null;
  handleSubmit: (e: FormEvent) => void;
}

export default function LoginForm({
  formData,
  handleChange,
  submitting,
  error,
  handleSubmit,
}: LoginFormProps) {
  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <label
          htmlFor="userId"
          className="font-bold text-sm text-[var(--color-fg)]"
        >
          아이디
        </label>
        <input
          id="userId"
          type="text"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          required
          placeholder="아이디를 입력하세요"
          className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="password"
          className="font-bold text-sm text-[var(--color-fg)]"
        >
          비밀번호
        </label>
        <input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          required
          placeholder="비밀번호를 입력하세요"
          className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[var(--color-error)]/10 text-[var(--color-error)] text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={submitting}
        className={`
          p-4 rounded-xl border-0 text-base font-bold transition-colors w-full
          ${
            submitting
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-[var(--color-primary)] text-[var(--color-primary-fg)] hover:opacity-90 cursor-pointer"
          }
        `}
      >
        {submitting ? "로그인 중..." : "로그인"}
      </Button>
    </form>
  );
}
