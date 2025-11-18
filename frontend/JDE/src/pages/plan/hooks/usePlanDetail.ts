import { useCallback, useState, useEffect } from "react";
import { getPlanDetail } from "@/entities/plan/api/getPlanDetail";
import type { PlanDetailResponse } from "@/entities/plan/model/types";

export function usePlanDetail(planId: string | undefined) {
  const [planDetail, setPlanDetail] = useState<PlanDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchPlanDetail = useCallback(async () => {
    if (!planId) return;

    try {
      setIsLoading(true);
      setIsError(false);
      const data = await getPlanDetail(planId);
      setPlanDetail(data);
    } catch (error) {
      console.error("약속 상세 정보 로딩 실패:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    if (planId) {
      fetchPlanDetail();
    }
  }, [planId, fetchPlanDetail]);

  return {
    planDetail,
    isLoading,
    isError,
    fetchPlanDetail,
  };
}
