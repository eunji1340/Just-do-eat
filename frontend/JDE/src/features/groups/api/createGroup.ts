// 목적: 그룹 생성 API POST 요청 (단일 책임: 네트워크 호출만)
// 사용: UI/폼에서는 이 함수만 호출하여 생성 수행

export type CreateGroupPayload = {
  title: string;
  description?: string;
  maxMembers?: number;
};

export type CreateGroupResponse = {
  id: number;
  title: string;
};

export async function createGroup(payload: CreateGroupPayload): Promise<CreateGroupResponse> {
  const res = await fetch("/group", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    // 필요 시 credentials: 'include' 등 추가
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `그룹 생성 실패 (status: ${res.status})`);
  }

  return res.json();
}
