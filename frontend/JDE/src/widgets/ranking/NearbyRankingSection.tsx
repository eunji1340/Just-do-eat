// src/widgets/ranking/NearbyRankingSection.tsx
// 목적: 근처 인기 식당 Top 10 (가로 스크롤 + 좌/우 버튼 네비게이션)
// 단일 책임: 섹션 렌더링과 수평 스크롤 제어 (스타일은 인라인로 처리)

import * as React from "react";
import type { Restaurant } from "../../entities/restaurant/types";

type Props = {
  items?: Restaurant[];
  title?: string;
};

export default function NearbyRankingSection({
  items,
  title = "근처 인기 식당 Top 10",
}: Props) {
  const data = (items ?? []).slice(0, 10);

  const rowRef = React.useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(false);

  // 스크롤 위치에 따른 버튼 상태 업데이트
  const updateEdgeState = React.useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const nearStart = scrollLeft <= 2;
    const nearEnd = scrollLeft + clientWidth >= scrollWidth - 2;
    setAtStart(nearStart);
    setAtEnd(nearEnd);
  }, []);

  React.useEffect(() => {
    updateEdgeState();
    const el = rowRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateEdgeState, { passive: true });
    const onResize = () => updateEdgeState();
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", updateEdgeState);
      window.removeEventListener("resize", onResize);
    };
  }, [updateEdgeState]);

  // 좌/우 버튼 클릭 시 스크롤
  function scrollByDir(dir: "left" | "right") {
    const el = rowRef.current;
    if (!el) return;
    const amount = Math.floor(el.clientWidth * 0.9); // 한 번에 보이는 영역의 90%
    el.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  // 인라인 스타일 모음
  const sx = {
    section: {
      position: "relative" as const,
      borderRadius: 16,
      background: "rgba(255,255,255,0.7)",
      backdropFilter: "blur(6px)",
      padding: 16,
      boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
      border: "1px solid rgba(0,0,0,0.08)",
    },
    title: { fontSize: 18, fontWeight: 700, margin: "0 0 12px" },
    railOuter: {
      position: "relative" as const,
      marginLeft: -16,
      marginRight: -16,
      paddingLeft: 16,
      paddingRight: 16,
    },
    row: {
      display: "flex",
      flexWrap: "nowrap" as const,
      gap: 16,
      paddingBottom: 8,
      overflowX: "auto" as const,
      scrollBehavior: "smooth" as const,
      WebkitOverflowScrolling: "touch" as const,
    },
    card: {
      minWidth: 220,
      flexShrink: 0,
      borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.12)",
      background: "#fff",
      padding: 12,
      transition: "box-shadow .2s ease",
    },
    topRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    rank: { fontSize: 13, fontWeight: 700, color: "#374151" },
    detailBtn: {
      fontSize: 12,
      padding: "4px 8px",
      borderRadius: 8,
      border: "1px solid rgba(0,0,0,0.12)",
      background: "#fff",
      cursor: "pointer",
    },
    name: {
      fontWeight: 600,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap" as const,
    },
    meta1: { fontSize: 12, color: "#6b7280", marginTop: 4 },
    meta2: { fontSize: 12, color: "#9ca3af" },
    navBtn: (
      side: "left" | "right",
      disabled: boolean
    ): React.CSSProperties => ({
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
      [side]: 4,
      width: 36,
      height: 36,
      borderRadius: 999,
      border: "1px solid rgba(0,0,0,0.12)",
      background: disabled ? "rgba(255,255,255,0.6)" : "#fff",
      boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      display: "grid",
      placeItems: "center",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      userSelect: "none" as const,
      zIndex: 2,
    }),
    edgeFade: (side: "left" | "right"): React.CSSProperties => ({
      position: "absolute",
      top: 0,
      bottom: 0,
      [side]: 0,
      width: 28,
      pointerEvents: "none",
      background:
        side === "left"
          ? "linear-gradient(90deg, rgba(255,255,255,1), rgba(255,255,255,0))"
          : "linear-gradient(270deg, rgba(255,255,255,1), rgba(255,255,255,0))",
      zIndex: 1,
    }),
    icon: { fontSize: 16, lineHeight: 1 },
  };

  return (
    <section style={sx.section}>
      <h2 style={sx.title}>{title}</h2>

      <div style={sx.railOuter}>
        {!atStart && <div aria-hidden style={sx.edgeFade("left")} />}
        {!atEnd && <div aria-hidden style={sx.edgeFade("right")} />}

        <button
          type="button"
          aria-label="왼쪽으로 이동"
          disabled={atStart}
          onClick={() => scrollByDir("left")}
          style={sx.navBtn("left", atStart)}
        >
          <span style={sx.icon}>‹</span>
        </button>
        <button
          type="button"
          aria-label="오른쪽으로 이동"
          disabled={atEnd}
          onClick={() => scrollByDir("right")}
          style={sx.navBtn("right", atEnd)}
        >
          <span style={sx.icon}>›</span>
        </button>

        <div ref={rowRef} style={sx.row}>
          {data.map((r, idx) => (
            <div key={r.restaurant_id} style={sx.card}>
              <div style={sx.topRow}>
                <span style={sx.rank}>{idx + 1}위</span>
                <button
                  style={sx.detailBtn}
                  onClick={() => alert(`[미구현] ${r.name} 상세로 이동 예정`)}
                >
                  상세
                </button>
              </div>

              <div style={sx.name} title={r.name}>
                {r.name}
              </div>

              {/* 메타 정보: 카테고리 · 평점 */}
              <div style={sx.meta1}>
                {r.category ?? "카테고리 미정"} ·{" "}
                {r.rating?.toFixed?.(1) ?? "-"}★
              </div>

              {/* 메타 정보: 영업상태 · 거리 */}
              <div style={sx.meta2}>
                {r.is_open ? "영업중" : "영업종료"} · {r.distance_m ?? 0}m
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
