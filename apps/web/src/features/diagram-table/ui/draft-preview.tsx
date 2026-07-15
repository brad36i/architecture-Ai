"use client"

import { CheckCircle2, ImageIcon, Loader2 } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import type { DiagramDraft } from "@/features/diagram-table/model/mock"
import type { GeneratedDiagramPreview } from "../model/illustration-stream"
import { ZoomPanImage } from "./zoom-pan-image"

export function DraftPreview({
  draft,
  generatedPreview,
  isStreaming = false,
}: {
  draft: DiagramDraft | null
  generatedPreview?: GeneratedDiagramPreview | null
  isStreaming?: boolean
}) {
  if (isStreaming) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-md border border-dashed border-zinc-300/80 bg-zinc-50/80 p-8">
        <Loader2 className="size-10 animate-spin text-zinc-400" />
        <p className="mt-4 text-sm font-medium text-zinc-600">생성 중</p>
      </div>
    )
  }

  if (!draft && !generatedPreview) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-md border border-dashed border-zinc-300/80 bg-zinc-50/80 p-8">
        <ImageIcon className="size-12 text-zinc-300" />
        <p className="mt-4 text-sm text-zinc-500">생성 결과가 여기에 표시됩니다.</p>
      </div>
    )
  }

  if (generatedPreview) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <h3 className="min-w-0 truncate font-medium text-zinc-800">{generatedPreview.title}</h3>
          <CheckCircle2 className="size-5 shrink-0 text-zinc-400" />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          {generatedPreview.imageDataUrl ? (
            <div className="h-full min-h-0">
              <ZoomPanImage
                src={generatedPreview.imageDataUrl}
                alt={generatedPreview.title}
                className="h-full"
              />
            </div>
          ) : (
            <div className="rounded border border-zinc-200 bg-zinc-50 p-6 text-center">
              <ImageIcon className="mx-auto size-10 text-zinc-400" />
              <p className="mt-2 text-sm text-zinc-600">이미지 준비 중</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!draft) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-md border border-dashed border-zinc-300/80 bg-zinc-50/80 p-8">
        <ImageIcon className="size-12 text-zinc-300" />
        <p className="mt-4 text-sm text-zinc-500">생성 결과가 여기에 표시됩니다.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border border-zinc-200 bg-white p-5 shadow-xs">
      <h3 className="shrink-0 font-medium text-zinc-900">{draft.title}</h3>
      <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
        {draft.tableData ? (
          <div className="overflow-x-auto rounded-sm border border-zinc-200 bg-white shadow-sm">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <tbody>
                {draft.tableData.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className={cn(
                          "border border-zinc-200 px-4 py-3 align-top",
                          rowIdx === 0 && "bg-zinc-100 font-medium text-zinc-800",
                          cellIdx === 0 && rowIdx > 0 && "bg-zinc-50 font-medium"
                        )}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-sm border border-zinc-200 bg-white p-5 shadow-sm">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-zinc-700">{draft.content}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
