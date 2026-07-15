"use client"

import type { RBEvaluationLegacyEvaluator } from "@/features/rb-evaluation/model/api-types"

export function LegacyEvaluationComments({
  evaluators,
}: {
  evaluators: RBEvaluationLegacyEvaluator[]
}) {
  if (evaluators.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-500">
        표시할 평가 코멘트가 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {evaluators.map((evaluator) => (
        <div
          key={evaluator.evaluatorId}
          className="rounded-lg border border-zinc-200 bg-white p-5"
        >
          <h3 className="mb-4 font-semibold text-zinc-900">
            평가위원 {evaluator.evaluatorId}
          </h3>
          <p className="whitespace-pre-line text-sm leading-7 text-zinc-700">
            {evaluator.comment || "코멘트가 없습니다."}
          </p>
        </div>
      ))}
    </div>
  )
}
