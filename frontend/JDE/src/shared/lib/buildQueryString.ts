/**
 * 쿼리 파라미터 문자열 생성
 * - undefined, null, 빈 문자열 자동 제거
 *
 * @example
 * buildQueryString({ query: "치킨", page: 0, tag: undefined })
 * // => "query=치킨&page=0"
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    // undefined, null, 빈 문자열 제거
    if (value == null || value === "") return;

    // 배열 처리
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") {
          searchParams.append(key, String(item));
        }
      });
      return;
    }

    // 숫자, 불리언, 문자열
    searchParams.append(key, String(value));
  });

  return searchParams.toString();
}
