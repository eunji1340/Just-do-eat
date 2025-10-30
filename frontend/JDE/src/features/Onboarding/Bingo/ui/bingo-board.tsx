// --------------------------------------------
// features/Onboarding/Bingo/ui/bingo-board.tsx
// --------------------------------------------
import type { Tri, BingoItem } from '../model/bingo-types';

export type BingoBoardValue = Record<number, Tri>;

type Props = {
  items: BingoItem[];
  value: BingoBoardValue;
  onChange: (next: BingoBoardValue) => void;
};

export default function BingoBoard({ items, value, onChange }: Props) {
  const cycle = (idx: number) => {
    const cur = value[idx] ?? 0; // -1,0,1 순환
    const nxt = ((cur === 1 ? -1 : cur + 1) as Tri);
    onChange({ ...value, [idx]: nxt });
  };

  const badge = (v: Tri | undefined) => v === 1 ? 'LIKE' : v === -1 ? 'DISLIKE' : 'SKIP';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '500px', width: '100%' }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)', 
        gap: 8,
        aspectRatio: '1/1',
        maxWidth: '500px',
        width: '100%'
      }}>
        {items.map((item, idx) => {
          const v = value[idx] ?? 0;
          const bg = v === 1 ? '#0a0' : v === -1 ? '#a00' : '#fff';
          const color = v === 0 ? '#222' : '#fff';
          return (
            <button
              key={item.id}
              onClick={() => cycle(idx)}
              title={`${badge(v as Tri)}`}
              style={{ 
                padding: '8px', 
                borderRadius: 8, 
                border: '1px solid #ddd', 
                background: bg, 
                color, 
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                wordBreak: 'keep-all',
                lineHeight: '1.2'
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <small style={{ color: '#666', textAlign: 'center' }}>
        클릭할 때마다: SKIP → LIKE(초록) → DISLIKE(빨강) → SKIP
      </small>
    </div>
  );
}
