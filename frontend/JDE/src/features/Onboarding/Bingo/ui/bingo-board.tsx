// --------------------------------------------
// features/Onboarding/Bingo/ui/bingo-board.tsx
// --------------------------------------------

// 백엔드 API 응답 타입 (최소한의 정보만)
type BingoItem = {
  id: string;
  label: string;
};

// 호불호 선택 타입 (UI에서만 사용)
type VoteValue = -1 | 0 | 1; // DISLIKE | SKIP | LIKE

export type BingoBoardValue = Record<number, VoteValue>;

type Props = {
  items: BingoItem[];
  value: BingoBoardValue;
  onChange: (next: BingoBoardValue) => void;
};

export default function BingoBoard({ items, value, onChange }: Props) {
  const cycle = (idx: number) => {
    const cur = value[idx] ?? 0; // -1,0,1 순환
    const nxt = (cur === 1 ? -1 : cur + 1) as VoteValue;
    onChange({ ...value, [idx]: nxt });
  };

  const badge = (v: VoteValue | undefined) =>
    v === 1 ? "LIKE" : v === -1 ? "DISLIKE" : "SKIP";

  const getButtonStyles = (v: VoteValue) => {
    if (v === 1) {
      return "bg-red-500 text-white border-red-600";
    } else if (v === -1) {
      return "bg-blue-500 text-white border-blue-600";
    } else {
      return "bg-[var(--color-surface)] text-[var(--color-fg)] border-[var(--color-border)]";
    }
  };

  return (
    <div className="flex flex-col gap-3 max-w-[500px] w-full">
      <div className="grid grid-cols-5 gap-2 aspect-square max-w-[500px] w-full">
        {items.map((item, idx) => {
          const v = value[idx] ?? 0;
          return (
            <button
              key={item.id}
              onClick={() => cycle(idx)}
              title={`${badge(v as VoteValue)}`}
              className={`
                p-2 rounded-xl border-2 cursor-pointer
                flex items-center justify-center text-center
                text-xs font-medium leading-tight break-keep
                transition-all hover:opacity-90 hover:scale-105 active:scale-95
                ${getButtonStyles(v as VoteValue)}
              `}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {/* <small className="text-[var(--color-muted)] text-center">
        클릭할 때마다: SKIP → LIKE(초록) → DISLIKE(빨강) → SKIP
      </small> */}
    </div>
  );
}
