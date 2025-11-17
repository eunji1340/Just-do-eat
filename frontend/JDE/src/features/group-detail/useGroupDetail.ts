// src/features/group-detail/useGroupDetail.ts
import * as React from "react";
import type { GroupDetail } from "@/entities/groups/types";
import { dummyGroupDetail } from "@/entities/groups/dummy-detail";

export function useGroupDetail(groupId: string) {
  const [data, setData] = React.useState<GroupDetail | null>(null);
  const [error, setError] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    let alive = true;            // ⚠️ 메모리릭/중복세팅 방지
    setData(null);               // 로딩 시작
    setError(undefined);

    // TODO: 실제 axios 교체
    // fetch(`/api/groups/${groupId}`)
    //   .then(r => r.json())
    //   .then(json => { if (alive) setData(json) })
    //   .catch(e => { if (alive) setError(String(e)); });

    if (alive) setData(dummyGroupDetail);

    return () => { alive = false };
  }, [groupId]);                 // ✅ groupId만! data/error 넣지 마세요.

  const loading = data === null && !error;
  return { data, loading, error };
}
