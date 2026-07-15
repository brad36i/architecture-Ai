"use client"

import { useState } from "react"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib/utils"
import type { ChecklistItem } from "@/features/differentiation/model/mock"

interface ChecklistTabProps {
  items: ChecklistItem[]
  onUpdate?: (id: string, updates: Partial<ChecklistItem>) => void
}

export function ChecklistTab({ items, onUpdate }: ChecklistTabProps) {
  const [localItems, setLocalItems] = useState(items)

  const handleCheck = (id: string, checked: boolean) => {
    setLocalItems((prev) => prev.map((i) => i.id === id ? { ...i, checked } : i))
    onUpdate?.(id, { checked })
  }

  const handleScoreChange = (id: string, score: number) => {
    setLocalItems((prev) => prev.map((i) => i.id === id ? { ...i, score } : i))
    onUpdate?.(id, { score })
  }

  const handleMemoChange = (id: string, memo: string) => {
    setLocalItems((prev) => prev.map((i) => i.id === id ? { ...i, memo } : i))
    onUpdate?.(id, { memo })
  }

  const totalScore = localItems.reduce((acc, i) => acc + (i.score ?? 0), 0)
  const maxTotal = localItems.reduce((acc, i) => acc + i.maxScore, 0)

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2">
          <span className="text-sm font-medium text-zinc-700">자가 점검 결과</span>
          <span className="text-sm font-semibold text-zinc-900">{totalScore} / {maxTotal}점</span>
        </div>
        <div className="space-y-4">
          {localItems.map((item) => (
            <div key={item.id}
              className={cn("rounded-lg border bg-white p-4 transition-colors",
                item.checked ? "border-zinc-200" : "border-amber-200 bg-amber-50/30")}>
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={item.checked} onChange={(e) => handleCheck(item.id, e.target.checked)}
                  className="mt-1 size-4 shrink-0 rounded border-zinc-300" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-900">{item.label}</span>
                    <span className="text-xs text-zinc-500">(최대 {item.maxScore}점)</span>
                  </div>
                  <p className="mt-0.5 text-sm text-zinc-600">{item.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-zinc-500">자가점수:</span>
                    <input type="number" min={0} max={item.maxScore} value={item.score ?? ""}
                      onChange={(e) => {
                        const v = e.target.value
                        handleScoreChange(item.id, v === "" ? 0 : Math.min(item.maxScore, Math.max(0, parseInt(v, 10) || 0)))
                      }}
                      className="h-8 w-14 rounded border border-zinc-200 px-2 text-sm" />
                    <span className="text-xs text-zinc-500">/ {item.maxScore}점</span>
                  </div>
                  <Input placeholder="메모 (보완 사항 등)" value={item.memo}
                    onChange={(e) => handleMemoChange(item.id, e.target.value)} className="mt-2 text-sm" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
