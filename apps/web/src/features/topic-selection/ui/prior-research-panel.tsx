"use client"

import { useMemo, useState, type MouseEvent } from "react"
import { useParams, useRouter } from "next/navigation"

import {
  ResultCard,
  searchResultToClippingCreate,
  useClippings,
  usePriorResearchDetailQuery,
  useRelatedWorksStore,
} from "@/features/related-works"
import type { DocumentType, SearchResult } from "@/features/related-works/model/types"
import { useAsidebarStore } from "@/shared/stores/asidebar-store"
import { Button } from "@/shared/ui/button"
import { FloatingLineTabs } from "@/shared/ui/floating-line-tabs"

import { useTopicNodePriorResearch } from "../model/use-topic-node-prior-research"

type TabType = "report" | "paper" | "patent" | "article"

const TAB_CONFIG: Record<TabType, { label: string }> = {
  report: { label: "건축사례" },
  paper: { label: "논문" },
  patent: { label: "특허" },
  article: { label: "기사·블로그" },
}

function resultsByDocumentType(results: SearchResult[]) {
  const groups: Record<DocumentType, SearchResult[]> = {
    report: [],
    paper: [],
    patent: [],
    article: [],
    blog: [],
  }
  results.forEach((r) => {
    groups[r.type].push(r)
  })
  return groups
}

export function PriorResearchPanelContent() {
  const params = useParams()
  const router = useRouter()
  const projectId = (params?.id as string) ?? ""
  const { priorResearchContext, closePanel, openPanel } = useAsidebarStore()
  const backendTopicNodeId = priorResearchContext?.backendTopicNodeId ?? null
  const focusNodeId = priorResearchContext?.nodeId ?? ""

  const topicQuery = useTopicNodePriorResearch(
    projectId,
    backendTopicNodeId,
    Boolean(priorResearchContext)
  )

  const researchId = topicQuery.data?.id?.trim() || null
  const detailQuery = usePriorResearchDetailQuery(projectId, researchId, {
    enabled: Boolean(priorResearchContext && researchId),
  })

  const results = detailQuery.data ?? []
  const byType = useMemo(() => resultsByDocumentType(results), [results])
  const [activeTab, setActiveTab] = useState<TabType>("report")
  const tabResults = byType[activeTab]

  const { createClipping, createPending } = useClippings(projectId)

  const handleCardOpen = (result: SearchResult) => {
    useRelatedWorksStore.setState({ previewItem: result })
    openPanel("문헌상세")
  }

  const handleCardAreaClick = (e: MouseEvent, result: SearchResult) => {
    if ((e.target as HTMLElement).closest("button, a, input, [role='checkbox']")) return
    handleCardOpen(result)
  }

  const handleBookmark = async (result: SearchResult) => {
    if (!projectId) return
    await createClipping(searchResultToClippingCreate(result))
  }

  const handleGoToDetail = () => {
    if (!projectId || !researchId) return
    router.push(
      `/projects/${projectId}/related-works?historyId=${encodeURIComponent(researchId)}&returnTo=topic-selection&focusNode=${encodeURIComponent(focusNodeId)}`
    )
    closePanel()
  }

  if (!priorResearchContext) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-zinc-500">
          주제 노드의 <strong>선행연구</strong> 버튼을 누르면
          <br />
          해당 토픽의 선행연구 요약·목록을 볼 수 있습니다.
        </p>
      </div>
    )
  }

  if (topicQuery.isPending) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6 text-center text-sm text-zinc-400">
        선행연구 정보를 불러오는 중…
      </div>
    )
  }

  if (topicQuery.isError) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-2 text-sm text-red-300">
        <p>{topicQuery.error instanceof Error ? topicQuery.error.message : "조회에 실패했습니다."}</p>
        <p className="text-xs text-zinc-500">
          토픽이 서버에 저장된 뒤에만 조회할 수 있습니다. 잠시 후 다시 시도해 주세요.
        </p>
      </div>
    )
  }

  const summary = topicQuery.data
  if (!summary) {
    return (
      <p className="text-xs text-zinc-500">선행연구 데이터가 없습니다.</p>
    )
  }

  const createdLabel = summary.createdAt
    ? new Date(summary.createdAt).toLocaleString("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-3 text-zinc-200">
      <div className="shrink-0 space-y-2 bg-zinc-900/40 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-zinc-100">
            {summary.title}
          </p>
          <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
            {summary.isAuto === true && (
              <span className="rounded border border-zinc-600 px-1.5 py-0.5 text-[10px] text-zinc-400">
                자동
              </span>
            )}
            {summary.isAuto === false && (
              <span className="rounded border border-zinc-600 px-1.5 py-0.5 text-[10px] text-zinc-400">
                수동
              </span>
            )}
            {summary.topicDeleted && (
              <span className="rounded border border-amber-700/60 bg-amber-950/40 px-1.5 py-0.5 text-[10px] text-amber-200">
                토픽 삭제됨
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-zinc-400">
          <span className="text-zinc-500">생성일시</span>{" "}
          {createdLabel ?? "—"}
        </p>
      </div>

      {researchId && (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          <h3 className="shrink-0 text-[11px] font-semibold text-zinc-500">문헌 목록</h3>
          {detailQuery.isPending && (
            <p className="shrink-0 text-xs text-zinc-500">상세 목록을 불러오는 중…</p>
          )}
          {detailQuery.isError && (
            <p className="shrink-0 text-xs text-red-300">
              {detailQuery.error instanceof Error
                ? detailQuery.error.message
                : "목록을 불러오지 못했습니다."}
            </p>
          )}
          {detailQuery.isSuccess && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <FloatingLineTabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as TabType)}
                items={(Object.keys(TAB_CONFIG) as TabType[]).map((tab) => ({
                  value: tab,
                  label: TAB_CONFIG[tab].label,
                  badge: byType[tab].length,
                }))}
              />
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-2 space-y-2.5 pr-1">
                {tabResults.length === 0 ? (
                  <p className="py-4 text-center text-xs text-zinc-500">
                    이 유형의 결과가 없습니다.
                  </p>
                ) : (
                  tabResults.map((result) => (
                    <div
                      key={result.id}
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer text-left"
                      onClick={(e) => handleCardAreaClick(e, result)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          handleCardOpen(result)
                        }
                      }}
                    >
                      <ResultCard
                        variant="dark"
                        result={result}
                        isBookmarked={false}
                        onBookmark={projectId ? () => void handleBookmark(result) : undefined}
                      >
                        <ResultCard.Header />
                        <ResultCard.Body />
                        <ResultCard.Footer />
                      </ResultCard>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <Button
        variant="default"
        size="sm"
        className="mt-auto w-full shrink-0"
        disabled={!researchId}
        onClick={handleGoToDetail}
      >
        선행연구 조사에서 열기
      </Button>
      {createPending && (
        <p className="text-center text-[10px] text-zinc-500">갈무리 저장 중…</p>
      )}
    </div>
  )
}
