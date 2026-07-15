"use client"

import { cn } from "@/shared/lib/utils"
import type { RBEvaluationCategory } from "@/features/rb-evaluation/model/api-types"

export function EvaluationChecklist({
  categories,
}: {
  categories: RBEvaluationCategory[]
}) {
  const flatItems = categories.flatMap((category) =>
    category.items.map((item) => ({
      categoryName: category.categoryName,
      categoryMaxScore: category.categoryMaxScore,
      categoryScore: category.categoryScore,
      ...item,
    }))
  )
  const insufficient = flatItems.filter((item) => item.score < item.maxScore * 0.7)

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <section key={category.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">{category.categoryName}</h2>
              <p className="mt-1 text-sm text-zinc-600">
                카테고리 점수 {category.categoryScore} / {category.categoryMaxScore}점
              </p>
            </div>
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
              {category.items.length}개 항목
            </span>
          </div>

          {category.items.length > 0 ? (
            category.items.map((item, index) => (
              <div
                key={`${category.id}-${index}-${item.itemName}`}
                className={cn(
                  "rounded-lg border bg-white p-4",
                  item.score < item.maxScore * 0.7
                    ? "border-amber-200 bg-amber-50/20"
                    : "border-zinc-200"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-zinc-900">{item.itemName}</h3>
                    {item.reasoning ? (
                      <p className="mt-1 text-sm leading-6 text-zinc-600">{item.reasoning}</p>
                    ) : null}
                  </div>
                  <div className="shrink-0 rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm font-medium text-zinc-800">
                    {item.score} / {item.maxScore}점
                  </div>
                </div>

                {item.evidence.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-zinc-900">근거</p>
                    <ul className="mt-2 space-y-2">
                      {item.evidence.map((evidenceItem) => (
                        <li key={evidenceItem} className="flex gap-2 text-sm text-zinc-600">
                          <span className="shrink-0 text-zinc-400">•</span>
                          <span>{evidenceItem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {item.improvement ? (
                  <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 px-3 py-3">
                    <p className="text-sm font-medium text-blue-900">개선 제안</p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-blue-800">
                      {item.improvement}
                    </p>
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-500">
              표시할 평가 항목이 없습니다.
            </div>
          )}
        </section>
      ))}

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-center justify-between">
          <span className="font-medium text-zinc-800">보완 권장 항목</span>
          <span className="text-xl font-semibold text-zinc-900">{insufficient.length}개</span>
        </div>
        {insufficient.length > 0 && (
          <p className="mt-2 text-sm text-amber-700">
            보완 권장: {insufficient.map((item) => item.itemName).join(", ")} (배점의 70% 미달)
          </p>
        )}
        {insufficient.length === 0 && (
          <p className="mt-2 text-sm text-zinc-600">현재 보완 권장 기준에 해당하는 항목이 없습니다.</p>
        )}
      </div>
    </div>
  )
}
