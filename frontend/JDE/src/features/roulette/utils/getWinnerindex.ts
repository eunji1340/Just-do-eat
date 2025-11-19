// src/features/roulette/lib/getDeterministicWinnerIndex.ts
// 목적: 같은 planId + 같은 후보 리스트에 대해 항상 같은 winnerIndex를 반환하는 유틸

/** 간단한 문자열 해시 함수 (djb2 변형) */
function stringHash(str: string): number {
  let hash = 5381;

  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }

  return Math.abs(hash);
}

/**
 * 같은 planId + 같은 후보 리스트라면
 * 항상 같은 winnerIndex(0 ~ candidateIds.length - 1)를 반환합니다.
 */
export function getDeterministicWinnerIndex(
  planId: string,
  candidateIds: number[]
): number {
  if (!planId || candidateIds.length === 0) return 0;

  // 혹시 서버에서 오는 순서가 바뀌어도 동일 결과 나오도록 정렬
  const sorted = [...candidateIds].sort((a, b) => a - b);
  const seed = `${planId}:${sorted.join(",")}`;

  const hash = stringHash(seed);
  return hash % sorted.length;
}
