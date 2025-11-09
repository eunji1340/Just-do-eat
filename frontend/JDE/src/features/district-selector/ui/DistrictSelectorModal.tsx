// src/features/district-selector/ui/DistrictSelectorModal.tsx
// 목적: 인기 상권 선택 모달

import * as React from "react";
import { X, MapPin, Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { District } from "@/entities/district";
import { popularDistricts } from "@/entities/district";

interface DistrictSelectorModalProps {
  /** 모달 열림 상태 */
  isOpen: boolean;
  /** 모달 닫기 핸들러 */
  onClose: () => void;
  /** 현재 선택된 상권 ID */
  selectedDistrictId?: string;
  /** 상권 선택 핸들러 */
  onSelect: (district: District) => void;
}

/**
 * 인기 상권 선택 모달
 * - 5개의 인기 상권 목록 표시
 * - 현재 선택된 상권 표시
 * - 확인 버튼으로 선택 확정
 */
export const DistrictSelectorModal: React.FC<DistrictSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedDistrictId,
  onSelect,
}) => {
  // 임시 선택 상태 (확인 버튼 클릭 전까지는 실제 선택에 반영 안됨)
  const [tempSelectedId, setTempSelectedId] = React.useState<string | undefined>(selectedDistrictId);

  // 배경 스크롤 막기
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // selectedDistrictId가 변경되면 tempSelectedId도 업데이트
  React.useEffect(() => {
    if (isOpen) {
      setTempSelectedId(selectedDistrictId);
    }
  }, [isOpen, selectedDistrictId]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (tempSelectedId) {
      const selectedDistrict = popularDistricts.find(d => d.id === tempSelectedId);
      if (selectedDistrict) {
        onSelect(selectedDistrict);
      }
    }
    onClose();
  };

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 z-[60] animate-in fade-in"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="fixed inset-x-0 bottom-0 z-[70] animate-in slide-in-from-bottom duration-300 flex justify-center">
        <div className="bg-surface rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden w-full max-w-2xl">
          {/* 헤더 */}
          <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-card-foreground">
              인기 상권 선택
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-card-foreground transition-colors"
              aria-label="닫기"
            >
              <X className="w-6 h-6" strokeWidth={2} />
            </button>
          </div>

          {/* 상권 리스트 */}
          <div className="overflow-y-auto max-h-[calc(80vh-160px)]">
            <div className="px-4 py-3 space-y-2">
              {popularDistricts.map((district) => {
                const isSelected = tempSelectedId === district.id;

                return (
                  <button
                    key={district.id}
                    onClick={() => setTempSelectedId(district.id)}
                    className={cn(
                      "w-full px-4 py-4 rounded-xl transition-all",
                      "flex items-center justify-between",
                      "border-2",
                      isSelected
                        ? "bg-[var(--color-t3)] border-[var(--color-primary)]"
                        : "bg-card border-border hover:border-[var(--color-primary)] hover:bg-muted"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin
                        className={cn(
                          "w-5 h-5 mt-0.5 flex-shrink-0",
                          isSelected
                            ? "text-[var(--color-primary)]"
                            : "text-muted-foreground"
                        )}
                        strokeWidth={2}
                      />
                      <div className="text-left">
                        <p className="text-base font-semibold text-card-foreground">
                          {district.name}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {district.address}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <Check
                        className="w-6 h-6 text-[var(--color-primary)] flex-shrink-0"
                        strokeWidth={2.5}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 확인 버튼 */}
          <div className="sticky bottom-0 bg-surface border-t border-border px-4 py-4">
            <button
              onClick={handleConfirm}
              className="w-full bg-[var(--color-primary)] text-white font-semibold py-3 rounded-lg hover:bg-[var(--color-s2)] transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
