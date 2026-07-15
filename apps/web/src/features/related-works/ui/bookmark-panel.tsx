"use client"

import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, Bookmark, Trash2, Loader2 } from "lucide-react"
import { useParams } from "next/navigation"
import { useClippingsListSortStore } from "@/features/related-works/model/clippings-list-sort-store"
import type { ClippingListSortParam } from "@/features/related-works/model/clippings-list-sort-store"
import { useClippings } from "@/features/related-works/model/use-clippings"
import { DeleteConfirmModal } from "@/shared/ui/delete-confirm-modal"
import { SortDropdown, type SortOption } from "@/shared/ui/sort-dropdown"
import type { ClippingResponse } from "@/features/related-works/model/use-clippings"
import { cn } from "@/shared/lib/utils"

const CLIPPING_TYPE_LABELS: Record<string, string> = {
  text: "텍스트",
  link: "링크",
  table: "표",
  image: "이미지",
}

const SOURCE_AGENT_LABELS: Record<string, string> = {
  topic_selection: "주제선정",
  topic_refinement: "주제다듬기",
  prior_research: "선행연구",
  proposal: "제안",
  diagram_suggestion: "도식",
  differentiation_review: "차별화",
  tech_classification: "기술분류",
  rb_evaluation: "RB평가",
  execution: "실행",
}

const CLIPPINGS_SORT_OPTIONS: SortOption<ClippingListSortParam>[] = [
  { value: "-created_at", label: "최신순", icon: <ArrowDown className="size-4" /> },
  { value: "created_at", label: "오래된순", icon: <ArrowUp className="size-4" /> },
]

/** 플로팅 패널 헤더 우측 — 선행연구 조사 목록과 동일한 SortDropdown */
export function ClippingsSortDropdown() {
  const sort = useClippingsListSortStore((s) => s.sort)
  const setSort = useClippingsListSortStore((s) => s.setSort)
  return (
    <SortDropdown
      options={CLIPPINGS_SORT_OPTIONS}
      value={sort}
      onChange={setSort}
      className="h-8 text-zinc-300 hover:bg-zinc-700 hover:text-white"
    />
  )
}

export function BookmarkPanel() {
  const params = useParams()
  const projectId = (params?.id as string) ?? ""
  const sort = useClippingsListSortStore((s) => s.sort)
  const listParams = useMemo(
    () => ({ sort, limit: 100 as const }),
    [sort]
  )
  const { clippings, isLoading, deleteClipping, deletePending } =
    useClippings(projectId, listParams)

  const [deleteTarget, setDeleteTarget] = useState<ClippingResponse | null>(
    null
  )

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    await deleteClipping(deleteTarget.id)
    setDeleteTarget(null)
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="size-8 animate-spin text-zinc-400" />
        <p className="text-sm">갈무리 목록을 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-2 overflow-auto">
        {clippings.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-500">
            저장된 갈무리가 없습니다
          </p>
        ) : (
          clippings.map((item) => (
            <ClippingCard
              key={item.id}
              item={item}
              onDelete={() => setDeleteTarget(item)}
            />
          ))
        )}
      </div>

      <DeleteConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deletePending}
      />
    </div>
  )
}

interface ClippingCardProps {
  item: ClippingResponse
  onDelete: () => void
}

function ClippingCard({ item, onDelete }: ClippingCardProps) {
  const date = new Date(item.createdAt)
  const formattedDate = date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  const typeLabel = CLIPPING_TYPE_LABELS[item.clippingType] ?? item.clippingType
  const sourceKey = item.sourceAgent ?? ""
  const sourceLabel =
    (sourceKey && SOURCE_AGENT_LABELS[sourceKey]) || sourceKey || null

  const titleLine =
    item.title?.trim() ||
    item.content.split(/\r?\n/).find((l) => l.trim()) ||
    item.content.slice(0, 80)

  return (
    <div className="group rounded-xs border border-zinc-700 bg-zinc-800 p-3">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xs bg-zinc-700">
          <Bookmark className="size-4 text-amber-400/90" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-200">
            {titleLine}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span>{formattedDate}</span>
            <span className="rounded-xs bg-zinc-700 px-1.5 py-0.5 text-zinc-400">
              {typeLabel}
            </span>
            {sourceLabel ? (
              <span className="rounded-xs bg-zinc-700/80 px-1.5 py-0.5 text-zinc-500">
                {sourceLabel}
              </span>
            ) : null}
          </div>
          <pre
            className={cn(
              "mt-2 max-h-28 overflow-y-auto whitespace-pre-wrap wrap-break-word text-left text-xs leading-relaxed text-zinc-400"
            )}
          >
            {item.content}
          </pre>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onDelete}
            className="rounded-xs p-1.5 text-zinc-500 hover:bg-zinc-700 hover:text-red-400"
            title="삭제"
            aria-label="삭제"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
