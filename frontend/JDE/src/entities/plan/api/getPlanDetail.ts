import http from "@/shared/api/http";
import type { PlanDetail } from "../model/types";

export async function getPlanDetail(planId: string): Promise<PlanDetail> {
  const { data } = await http.get<PlanDetail>(`/plans/${planId}`);
  return data;
}

