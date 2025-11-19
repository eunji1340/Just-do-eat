// ================================
// File: src/widgets/groups/MemberAvatarList.tsx
// 목적: 가로 스크롤 가능한 모임원 리스트 UI (고정 아바타 사이즈 + 넘치면 스크롤)
// 단일 책임: 프리젠테이션
// 변경 요점:
// - 컨테이너: overflow-x-auto 유지 + 스크롤바 숨김(옵션)
// - 아이템: flex-none / shrink-0 로 절대 줄어들지 않게 고정
// - 아바타: h-12 w-12 고정, shrink-0
// - 닉네임 폭도 w-16로 고정해 레이아웃 안정화
// - (옵션) 스냅 스크롤 적용(snap-x)
// - (옵션) maxVisible로 "+N" 처리 가능(미설정 시 전체 표시)
// ================================

import * as React from "react";
import type { RoomMember } from "@/entities/groups/types";

type Props = {
  members: RoomMember[];
  /** '+N' 집계를 위한 최대 표시 개수 (옵션). 미설정 시 전체 표시 */
  maxVisible?: number;
};

export default function MemberAvatarList({ members, maxVisible }: Props) {
  const visible = members.slice(0, maxVisible ?? members.length);
  const rest = Math.max(0, members.length - visible.length);

  return (
    <div
      className={[
        "h-[8vh]",
        // 가로 스크롤 컨테이너
        "flex items-center gap-3 overflow-x-auto pb-0 pr-3",
        // 스냅 스크롤(옵션): 항목 단위로 딱딱 맞게 멈춤
        "snap-x snap-mandatory",
        // 모바일/크롬 등 스크롤바 숨김(옵션)
        "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
      ].join(" ")}
      aria-label="모임원 아바타 목록"
    >
      {visible.map((m) => (
        <div
          key={m.userId}
          // 아이템 박스가 절대 줄어들지 않게 고정
          className="flex w-12 flex-none shrink-0 snap-start flex-col items-center"
        >
          <Avatar url={m.imageUrl} name={m.userName} />
          {/* 닉네임 폭도 w-12로 고정해서 줄바꿈/줄임 처리 안정화 */}
          <span className="mt-1 line-clamp-1 w-12 text-center text-xs text-foreground/80">
            {m.userName}
          </span>
        </div>
      ))}

      {rest > 0 && (
        <div className="flex h-10 w-10 flex-none shrink-0 snap-start items-center justify-center rounded-full border bg-background text-xs text-foreground/70">
          +{rest}
        </div>
      )}
    </div>
  );
}

function Avatar({ url, name }: { url?: string; name: string }) {
  const [imageError, setImageError] = React.useState(false);
  const initials = name.slice(0, 1);

  // 공통: 절대 줄어들지 않도록 shrink-0/flex-none 추가
  const baseClass = "h-10 w-10 rounded-full shrink-0 flex-none";

  // 이미지가 없거나 에러가 있으면 초성 표시
  if (!url || imageError) {
    return (
      <div
        className={[
          baseClass,
          "grid place-items-center bg-muted text-sm font-semibold text-foreground/70",
        ].join(" ")}
        aria-label={`${name} 기본 아바타`}
      >
        <span className="select-none">{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={`${name} 프로필 이미지`}
      className={[baseClass, "object-cover shadow"].join(" ")}
      loading="lazy"
      decoding="async"
      onError={() => {
        setImageError(true);
      }}
    />
  );
}
