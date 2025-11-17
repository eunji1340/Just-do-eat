import type { FormEvent } from 'react';
import { Button } from '@/shared/ui/button';
import UserIdCheckInput from './UserIdCheckInput';
import { OnboardingSummary } from '@/widgets/onboarding/OnboardingSummary';

type AgeGroup = 'TEENS' | 'TWENTIES' | 'THIRTIES' | 'FORTIES' | 'FIFTIES_PLUS';
type Gender = 'MALE' | 'FEMALE' | 'OTHER';

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
  setNameCheckResult: (result: { checking: boolean; available: boolean | null; message: string }) => void;
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

  return (
    <>
      <OnboardingSummary />

      <form onSubmit={handleSubmit} className="grid gap-4">
        <UserIdCheckInput
          userId={formData.name}
          onChange={(value) => handleChange('name', value)}
          onCheckResult={setNameCheckResult}
        />

        <div className="grid gap-2">
          <label htmlFor="password" className="font-bold text-sm text-[var(--color-fg)]">
            비밀번호 *
          </label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            required
            placeholder="8자 이상, 영문/숫자/특수문자 포함"
            className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="passwordConfirm" className="font-bold text-sm text-[var(--color-fg)]">
            비밀번호 확인 *
          </label>
          <input
            id="passwordConfirm"
            type="password"
            value={formData.passwordConfirm}
            onChange={(e) => handleChange('passwordConfirm', e.target.value)}
            required
            placeholder="비밀번호 재입력"
            className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="profileImage" className="font-bold text-sm text-[var(--color-fg)]">
            프로필 이미지
          </label>
          <input
            id="profileImage"
            type="file"
            accept="image/*"
            onChange={(event) => handleImageSelect(event.target.files?.[0] ?? null)}
            className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          {previewUrl || formData.imageUrl ? (
            <div className="flex items-center gap-3">
              <img
                src={previewUrl ?? formData.imageUrl ?? ''}
                alt="프로필 미리보기"
                className="w-16 h-16 rounded-full object-cover border border-[var(--color-border)]"
              />
              <button
                type="button"
                onClick={() => handleImageSelect(null)}
                className="text-sm text-[var(--color-primary)] hover:underline"
              >
                이미지 제거
              </button>
            </div>
          ) : (
            <span className="text-xs text-[var(--color-muted-fg)]">선택된 이미지가 없습니다.</span>
          )}
        </div>

        <div className="grid gap-2">
          <label htmlFor="ageGroup" className="font-bold text-sm text-[var(--color-fg)]">
            연령대 *
          </label>
          <select
            id="ageGroup"
            value={formData.ageGroup}
            onChange={(e) => handleChange('ageGroup', e.target.value)}
            className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="TEENS">10대</option>
            <option value="TWENTIES">20대</option>
            <option value="THIRTIES">30대</option>
            <option value="FORTIES">40대</option>
            <option value="FIFTIES_PLUS">50대 이상</option>
          </select>
        </div>

        <div className="grid gap-2">
          <label className="font-bold text-sm text-[var(--color-fg)]">성별 *</label>
          <div className="flex gap-3 justify-center">
            {(['MALE', 'FEMALE', 'OTHER'] as const).map((gender) => (
              <label key={gender} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value={gender}
                  checked={formData.gender === gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="cursor-pointer"
                />
                <span className="text-sm text-[var(--color-fg)]">
                  {gender === 'MALE' ? '남성' : gender === 'FEMALE' ? '여성' : '기타'}
                </span>
              </label>
            ))}
          </div>
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
            ${submitting 
              ? 'bg-gray-400 cursor-not-allowed text-white' 
              : 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] hover:opacity-90 cursor-pointer'
            }
          `}
        >
          {submitting ? '가입 중...' : '회원가입'}
        </Button>
      </form>
    </>
  );
}

