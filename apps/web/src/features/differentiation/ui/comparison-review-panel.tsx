"use client"

import { HelpCircle } from "lucide-react"
import { Badge } from "@/shared/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip"
import { cn } from "@/shared/lib/utils"

import type {
  ComparisonAttributeInput,
  ComparisonResearch,
  DifferentiationReviewData,
} from "@/features/differentiation/model/types"

interface ComparisonReviewPanelProps {
  review: DifferentiationReviewData
}

function normalizeAttribute(attribute: ComparisonAttributeInput) {
  if ("label" in attribute && "value" in attribute) {
    return attribute
  }

  const [label = "", value = "-"] = Object.entries(attribute)[0] ?? []
  return { label, value }
}

function getAttributeMap(research: ComparisonResearch) {
  return new Map(research.attributes.map((attribute) => {
    const normalized = normalizeAttribute(attribute)
    return [normalized.label, normalized.value]
  }))
}

export function ComparisonReviewPanel({ review }: ComparisonReviewPanelProps) {
  const researches = review.relatedWorkComparison.researches
  const attributeMaps = new Map(
    researches.map((research) => [research.id, getAttributeMap(research)])
  )
  const ourResearchId =
    researches.find((research) => research.isOurResearch)?.id ??
    researches[researches.length - 1]?.id

  const attributeLabels = Array.from(
    new Set(
      researches.flatMap((research) =>
        research.attributes.map((attribute) => normalizeAttribute(attribute).label)
      )
    )
  )

  return (
    <section className="mb-8 space-y-5">
      <div className="border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="flex items-center gap-1.5 text-xl font-semibold tracking-tight text-zinc-900">
              유사 건축사례 비교 보드
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex shrink-0 rounded-full p-0.5 text-zinc-400 transition hover:text-zinc-600"
                      aria-label="사용설명"
                    >
                      <HelpCircle className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-sm">
                    논문/과제/특허와 우리 건축 계획을 같은 속성 축으로 비교할 수 있도록
                    구성했습니다. 열이 많아질 것을 고려해 가로 스크롤과 우리 건축 열
                    고정을 함께 적용했습니다.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-zinc-600">
            <div className="rounded-full bg-zinc-100 px-3 py-1.5">
              비교 문헌 {Math.max(researches.length - 1, 0)}건
            </div>
            <div className="rounded-full bg-zinc-100 px-3 py-1.5">
              비교 항목 {attributeLabels.length}개
            </div>
            <div className="rounded-full bg-zinc-100 px-3 py-1.5">
              강화 제안 {review.improvementRecommendations.length}개
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto border border-zinc-200 bg-zinc-50/60">
          <div className="min-w-[1860px]">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-30 min-w-[180px] border-b border-r border-zinc-200 bg-zinc-100 px-4 py-3 text-left font-semibold text-zinc-700">
                    비교 항목
                  </th>
                  {researches.map((research) => {
                    const isOurResearch = research.id === ourResearchId

                    return (
                      <th
                        key={research.id}
                        className={cn(
                          "min-w-[280px] border-b border-r border-zinc-200 px-5 py-3 text-left font-semibold text-zinc-700",
                          isOurResearch &&
                            "sticky right-0 z-20 border-l border-indigo-200 bg-indigo-50 shadow-[-18px_0_28px_-24px_rgba(79,70,229,0.65)]"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span>{research.name}</span>
                          {isOurResearch && (
                            <Badge className="bg-indigo-600 text-white hover:bg-indigo-600">
                              고정 열
                            </Badge>
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {attributeLabels.map((label, rowIndex) => (
                  <tr key={label}>
                    <th
                      className={cn(
                        "sticky left-0 z-20 min-w-[180px] border-b border-r border-zinc-200 bg-white px-4 py-4 text-left align-top font-medium text-zinc-700",
                        rowIndex % 2 === 1 && "bg-zinc-50"
                      )}
                    >
                      {label}
                    </th>
                    {researches.map((research) => {
                      const isOurResearch = research.id === ourResearchId
                      const attributeMap = attributeMaps.get(research.id)
                      const value = attributeMap?.get(label) ?? "-"

                      return (
                        <td
                          key={`${research.id}-${label}`}
                          className={cn(
                            "min-w-[280px] border-b border-r border-zinc-200 px-5 py-4 align-top leading-6 text-zinc-600",
                            rowIndex % 2 === 0 ? "bg-white" : "bg-zinc-50",
                            isOurResearch &&
                              "sticky right-0 z-10 border-l border-indigo-200 bg-indigo-50/95 font-medium text-indigo-950 shadow-[-18px_0_28px_-24px_rgba(79,70,229,0.65)]"
                          )}
                        >
                          {value}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <section className="rounded-xs border border-zinc-200 bg-white p-5 shadow-sm">
          <div>
            <h3 className="flex items-center gap-1.5 font-semibold text-zinc-900">
              AI 차별성 요약
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex shrink-0 rounded-full p-0.5 text-zinc-400 transition hover:text-zinc-600"
                      aria-label="사용설명"
                    >
                      <HelpCircle className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    핵심 포인트를 바로 읽히는 카드형 요약으로 구성했습니다.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h3>
          </div>

          <div className="mt-4 space-y-3">
            {review.differentiationSummary.map((summary, index) => (
              <div
                key={`${summary}-${index}`}
                className="rounded-xs border border-indigo-100 bg-linear-to-r from-indigo-50 via-white to-white p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xs bg-indigo-600 text-xs font-semibold text-white">
                    {index + 1}
                  </div>
                  <p className="pt-1 text-sm leading-6 text-zinc-700">{summary}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xs border border-zinc-200 bg-white p-5 shadow-sm">
          <div>
            <h3 className="flex items-center gap-1.5 font-semibold text-zinc-900">
              차별성 강화 제안
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex shrink-0 rounded-full p-0.5 text-zinc-400 transition hover:text-zinc-600"
                      aria-label="사용설명"
                    >
                      <HelpCircle className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    건축 제안서 보완 포인트를 액션 아이템처럼 보이도록 정리했습니다.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h3>
          </div>

          <div className="mt-4 space-y-3">
            {review.improvementRecommendations.map((recommendation, index) => (
              <div
                key={`${recommendation}-${index}`}
                className="rounded-xs border border-amber-200 bg-amber-50/60 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold tracking-[0.12em] text-amber-700">
                    ACTION {String(index + 1).padStart(2, "0")}
                  </span>
                  <Badge
                    variant="outline"
                    className="border-amber-300 bg-white text-amber-700"
                  >
                    보완 권장
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-700">
                  {recommendation}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}
