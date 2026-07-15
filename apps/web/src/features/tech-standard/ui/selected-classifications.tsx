"use client"

import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib/utils"
import type { SelectedClassification } from "@/features/tech-standard/model/mock"

const RANK_LABELS: Record<1 | 2 | 3, string> = { 1: "1순위", 2: "2순위", 3: "3순위" }

export function SelectedClassifications({ selected, onUpdateRatio, onRemove }: {
  selected: SelectedClassification[]
  onUpdateRatio: (rank: 1 | 2 | 3, ratio: number) => void
  onRemove: (rank: 1 | 2 | 3) => void
}) {
  const totalRatio = selected.reduce((acc, s) => acc + s.ratio, 0)
  const isValid = totalRatio === 100

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700">선택한 기술분류 (1~3순위, 비중 합 100%)</span>
        <span className={cn("text-sm font-medium", isValid ? "text-emerald-600" : "text-amber-600")}>
          합계: {totalRatio}%
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {([1, 2, 3] as const).map((rank) => {
          const item = selected.find((s) => s.rank === rank)
          return (
            <div key={rank} className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-700">{RANK_LABELS[rank]}</span>
                {item && (
                  <button type="button" onClick={() => onRemove(rank)} className="text-xs text-zinc-500 hover:text-red-600">제거</button>
                )}
              </div>
              {item ? (
                <>
                  <div className="text-sm font-medium text-zinc-900">{item.item.name}</div>
                  <div className="mt-0.5 text-xs text-zinc-500">{item.item.code} · {item.item.path}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-zinc-500">비중:</span>
                    <Input type="number" min={0} max={100} value={item.ratio}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10)
                        if (!Number.isNaN(v)) onUpdateRatio(rank, Math.min(100, Math.max(0, v)))
                      }}
                      className="h-8 w-20" />
                    <span className="text-xs text-zinc-500">%</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-zinc-500">왼쪽에서 분류를 선택하세요.</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
