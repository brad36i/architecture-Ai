"use client"

import type { TechClassificationGroup } from "@/features/tech-standard/model/api-types"
import { cn } from "@/shared/lib/utils"

interface SystemClassificationCardProps {
  group: TechClassificationGroup
}

export function SystemClassificationCard({ group }: SystemClassificationCardProps) {
  const sortedItems = [...group.items].sort((left, right) => left.rank - right.rank)
  const rowCount = Math.max(group.targetCount, sortedItems.length, 3)
  const rows = Array.from({ length: rowCount }, (_, index) => sortedItems[index] ?? null)
  const selectedCount = group.selectedCount
  const totalPercentage = group.weightSum
  const isValid = group.validated
  const statusToneClassName =
    selectedCount === 0
      ? "text-zinc-500"
      : isValid
        ? "text-emerald-600"
        : "text-amber-600"

  return (
    <section className="overflow-hidden rounded-xs border border-zinc-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-zinc-900">{group.taxonomyFamilyLabel}</h2>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-zinc-500">
            선택 {selectedCount}/{group.targetCount}
          </span>
          <span className={cn("font-medium", statusToneClassName)}>합계 {totalPercentage}%</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[100px_1fr_1fr_1fr_110px] border-b border-zinc-200 bg-zinc-50">
            <div className="px-4 py-2.5 text-center text-xs font-medium text-zinc-500">순위</div>
            <div className="border-l border-zinc-200 px-4 py-2.5 text-center text-xs font-medium text-zinc-500">
              대분류
            </div>
            <div className="border-l border-zinc-200 px-4 py-2.5 text-center text-xs font-medium text-zinc-500">
              중분류
            </div>
            <div className="border-l border-zinc-200 px-4 py-2.5 text-center text-xs font-medium text-zinc-500">
              소분류
            </div>
            <div className="border-l border-zinc-200 px-4 py-2.5 text-center text-xs font-medium text-zinc-500">
              비중
            </div>
          </div>

          {rows.map((item, index) => {
            return (
              <div
                key={`${group.taxonomyFamily}-${item?.rank ?? index + 1}`}
                className={cn(
                  "grid grid-cols-[100px_1fr_1fr_1fr_110px]",
                  index < rows.length - 1 && "border-b border-zinc-200"
                )}
              >
                <div className="px-4 py-2.5 text-center text-sm font-medium text-zinc-900">
                  {item?.rank ?? index + 1}순위
                </div>

                <div className="border-l border-zinc-200 px-4 py-2 text-center text-sm text-zinc-700">
                  {item?.l1 ?? "-"}
                </div>

                <div className="border-l border-zinc-200 px-4 py-2 text-center text-sm text-zinc-700">
                  {item?.l2 ?? "-"}
                </div>

                <div className="border-l border-zinc-200 px-4 py-2 text-center text-sm text-zinc-700">
                  {item?.l3 ?? "-"}
                </div>

                <div className="border-l border-zinc-200 px-4 py-2 text-right text-sm text-zinc-700">
                  {typeof item?.weight === "number" ? `${item.weight}%` : "-"}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="border-t border-zinc-200 px-4 py-3">
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-900">AI 근거</p>
          <div className="min-h-16 rounded-xs border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm leading-6 text-zinc-700">
            {group.aiRationale || "-"}
          </div>
        </div>
      </div>
    </section>
  )
}
