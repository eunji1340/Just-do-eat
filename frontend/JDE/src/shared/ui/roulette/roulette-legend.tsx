// 목적: 후보 리스트/가중치/색상 범례 (단일 책임: 리스트 UI)

import * as React from "react";
import type { RouletteItem } from "@/entities/roulette/types";

type Props = {
  items: RouletteItem[];
  onRemove?: (id: string) => void;
};

export default function RouletteLegend({ items, onRemove }: Props) {
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div
          key={it.id}
          className="flex items-center justify-between rounded-lg border p-2"
        >
          <div className="flex items-center gap-3">
            <span
              className="inline-block size-3 rounded"
              style={{ backgroundColor: it.color || "#999" }}
            />
            <span className="font-medium">{it.label}</span>
            <span className="text-xs text-gray-500">x{it.weight ?? 1}</span>
          </div>
          {onRemove && (
            <button
              className="text-xs text-gray-500 hover:text-red-500"
              onClick={() => onRemove(it.id)}
              aria-label={`${it.label} 제거`}
            >
              제거
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
