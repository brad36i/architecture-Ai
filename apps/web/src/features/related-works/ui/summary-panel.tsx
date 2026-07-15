"use client"

import { useParams } from "next/navigation"
import { FileText, Sparkles } from "lucide-react"
import { StateTag } from "@/shared/ui/state-tag"
import { useRelatedWorksStore } from "@/features/related-works/model/related-works-store"
import { useRelatedWorks } from "@/features/related-works/model/useRelatedWorks"
import type { DocumentType } from "@/features/related-works/model/types"

const TYPE_LABELS: Record<DocumentType, string> = {
  report: "건축사례",
  paper: "논문",
  patent: "특허",
  article: "기사",
  blog: "블로그",
}

export function SummaryPanel() {
  const params = useParams()
  const projectId = (params?.id as string) ?? ""
  const { selectedHistoryId } = useRelatedWorksStore()
  const { results, resultsByType, selectedHistory } = useRelatedWorks(
    projectId,
    selectedHistoryId
  )

  if (!selectedHistoryId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center text-zinc-500">
        <FileText className="size-12" />
        <p className="text-sm">검색 결과 상세 페이지에서<br />전체 요약을 확인하세요</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-auto p-4">
      <div className="mb-4">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">검색 키워드</h3>
        <p className="text-lg font-semibold text-zinc-100">{selectedHistory?.keyword}</p>
      </div>
      <div className="mb-6">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">결과 현황</h3>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(resultsByType) as DocumentType[]).map((type) => {
            const count = resultsByType[type].length
            if (count === 0) return null
            return (
              <StateTag key={type} variant="darkgray">
                {TYPE_LABELS[type]} {count}건
              </StateTag>
            )
          })}
        </div>
      </div>
      <div className="flex flex-1 flex-col rounded-xs border border-zinc-700 bg-zinc-800/50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-zinc-200">AI 요약</h3>
        </div>
        <div className="min-h-[200px] text-sm leading-relaxed text-zinc-400">
          {results.length > 0 ? (
            <p>총 {results.length}건의 문헌을 분석한 AI 요약이 여기에 표시됩니다. (추후 API 연동 예정)</p>
          ) : (
            <p>분석할 결과가 없습니다. 검색 결과를 먼저 확인해 주세요.</p>
          )}
        </div>
      </div>
    </div>
  )
}
