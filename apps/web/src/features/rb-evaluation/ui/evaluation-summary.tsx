"use client"

import type {
  RBEvaluationCategory,
  RBEvaluationSummary as RBEvaluationSummaryType,
} from "@/features/rb-evaluation/model/api-types"

export function EvaluationSummary({
  summary,
  categories,
}: {
  summary: RBEvaluationSummaryType
  categories: RBEvaluationCategory[]
}) {
  return (
    <div className="mb-6 space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-wrap items-center gap-4">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center gap-2">
            <span className="text-sm text-zinc-700">{category.categoryName}</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-zinc-800">
              {category.categoryScore} / {category.categoryMaxScore}점
            </span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-700">총점</span>
          <span className="text-lg font-semibold text-zinc-900">
            {summary.totalScore} / {summary.maxScore}점
          </span>
        </div>
      </div>
      {summary.overallComment ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm font-medium text-zinc-900">종합 코멘트</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-700">
            {summary.overallComment}
          </p>
        </div>
      ) : null}
    </div>
  )
}
