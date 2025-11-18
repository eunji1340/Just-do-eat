// src/features/group-detail/useGroupDetail.ts
import * as React from "react";
import type { Room } from "@/entities/groups/types";
import { getGroupDetail } from "./api/getGroupDetail";

export function useGroupDetail(roomId: string) {
  const [data, setData] = React.useState<Room | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!roomId) return;

    let cancelled = false;

    async function fetchDetail() {
      setLoading(true);
      setError(null);

      try {
        const result = await getGroupDetail(roomId);
        if (!cancelled) setData(result);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "로드 실패");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDetail();

    return () => {
      cancelled = true;
    };
  }, [roomId]);

  return { data, loading, error };
}
