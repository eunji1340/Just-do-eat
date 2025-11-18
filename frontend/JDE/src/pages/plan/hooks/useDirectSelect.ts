import { useCallback, useState, useEffect, useRef } from "react";
import { decidePlan } from "@/entities/plan/api/decidePlan";

export function useDirectSelect(
  planId: string | undefined,
  fetchPlanDetail: () => Promise<void>
) {
  const [directSelectMode, setDirectSelectMode] = useState(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<
    string | null
  >(null);
  const [showDecideSuccessModal, setShowDecideSuccessModal] = useState(false);

  const restaurantListRef = useRef<HTMLDivElement>(null);
  const bottomButtonsRef = useRef<HTMLDivElement>(null);

  const handleDirectSelect = useCallback(() => {
    setDirectSelectMode(true);
  }, []);

  const handleRestaurantSelect = useCallback((restaurantId: string) => {
    setSelectedRestaurantId(restaurantId);
  }, []);

  const handleCancelDirectSelect = useCallback(() => {
    setDirectSelectMode(false);
    setSelectedRestaurantId(null);
  }, []);

  const handleDirectSelectComplete = useCallback(async () => {
    if (!planId || !selectedRestaurantId) return;

    try {
      const restaurantIdNum = parseInt(selectedRestaurantId, 10);
      await decidePlan(planId, restaurantIdNum);
      setDirectSelectMode(false);
      setSelectedRestaurantId(null);
      await fetchPlanDetail();
      setShowDecideSuccessModal(true);
    } catch (error) {
      console.error("[handleDirectSelectComplete] 식당 확정 실패:", error);
      alert(
        error instanceof Error
          ? error.message
          : "식당 확정에 실패했습니다. 다시 시도해주세요."
      );
    }
  }, [planId, selectedRestaurantId, fetchPlanDetail]);

  useEffect(() => {
    if (!directSelectMode) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isRestaurantCard = target.closest("article");
      const isInRestaurantList = restaurantListRef.current?.contains(target);
      const isInBottomButtons = bottomButtonsRef.current?.contains(target);

      if (!isRestaurantCard && !isInRestaurantList && !isInBottomButtons) {
        handleCancelDirectSelect();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [directSelectMode, handleCancelDirectSelect]);

  return {
    directSelectMode,
    selectedRestaurantId,
    showDecideSuccessModal,
    setShowDecideSuccessModal,
    restaurantListRef,
    bottomButtonsRef,
    handleDirectSelect,
    handleRestaurantSelect,
    handleCancelDirectSelect,
    handleDirectSelectComplete,
  };
}
