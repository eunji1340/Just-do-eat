// -----------------------------------------------
// features/Onboarding/MukbtiTest/ui/mukbti-question.tsx
// -----------------------------------------------
import * as React from 'react';
import type { Question } from '../model/types';

type Props = { question: Question; onSelect: (choiceId: string) => void };

export default function MukbtiQuestion({ question, onSelect }: Props) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h2 style={{ margin: 0 }}>{question.text}</h2>
      <div style={{ display: 'grid', gap: 8 }}>
        {question.choices.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            style={{ padding:'12px 16px', borderRadius:12, border:'1px solid #ddd', background:'#222', color:'#fff', textAlign:'left', cursor:'pointer' }}
          >
            {c.text}
          </button>
        ))}
      </div>
    </div>
  );
}
