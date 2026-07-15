"use client"

import { forwardRef, useLayoutEffect, useRef, useState } from "react"
import type React from "react"
import { ResizableBox } from "react-resizable"
import { cn } from "@/shared/lib/utils"
import { StateTag } from "@/shared/ui/state-tag"
import type { Attachment } from "@/features/research-analysis/model/types"

const DEFAULT_SIDEBAR_WIDTH = 260
const MIN_SIDEBAR_WIDTH = 180
const MAX_SIDEBAR_WIDTH = 420
const MIN_VIEWER_WIDTH = 320

function getExtensionBadgeLabel(extension: string | null) {
  return extension ? extension.toUpperCase() : "FILE"
}

function formatTagLabelFromAttachment(a: Attachment): string {
  const fromApi = a.fileFormat?.trim()
  if (fromApi) return fromApi.toUpperCase()
  return getExtensionBadgeLabel(a.extension)
}

function formatFileSize(bytes: number | null): string | null {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10_240 ? 1 : 0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isPdfAttachment(attachment: Attachment | undefined): boolean {
  if (!attachment) return false
  if (attachment.extension?.toLowerCase() === "pdf") return true
  return attachment.fileFormat?.trim().toLowerCase() === "pdf"
}

function getAttachmentTagVariant(a: Attachment): "green" | "red" {
  return isPdfAttachment(a) ? "green" : "red"
}

const ResizeHandle = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        aria-hidden
        {...props}
        className={cn(
          "absolute top-0 right-0 z-10 h-full w-3 cursor-ew-resize bg-zinc-200/80 transition-colors hover:bg-zinc-300",
          className
        )}
      >
        <div className="mx-auto h-full w-px bg-zinc-300" />
      </div>
    )
  }
)

ResizeHandle.displayName = "ResizeHandle"

function AttachmentSidebar({
  attachments,
  selectedId,
  onSelect,
}: {
  attachments: Attachment[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex h-full w-full min-w-0 flex-col border-r border-zinc-200 bg-zinc-50">
      <div className="border-b border-zinc-200 px-3 py-2">
        <h3 className="text-xs font-semibold text-zinc-500">첨부파일</h3>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {attachments.map((a) => {
          const sizeLabel = formatFileSize(a.fileSize)
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onSelect(a.id)}
              title={a.title}
              className={cn(
                "w-full rounded-md px-2 py-2 text-left transition-colors",
                selectedId === a.id
                  ? "bg-zinc-200 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800"
              )}
            >
              <div className="flex items-start gap-2">
                <StateTag
                  variant={getAttachmentTagVariant(a)}
                  bordered
                  className="mt-0.5 shrink-0 text-[10px] font-semibold tracking-[0.08em]"
                >
                  {formatTagLabelFromAttachment(a)}
                </StateTag>
                <div className="min-w-0 flex-1">
                  <span className="line-clamp-2 block text-[13px] font-medium leading-5">{a.title}</span>
                  {sizeLabel ? (
                    <span className="mt-0.5 block text-[11px] tabular-nums text-zinc-400">{sizeLabel}</span>
                  ) : null}
                </div>
              </div>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

type AnnouncementTabProps = {
  attachments: Attachment[]
}

export function AnnouncementTab({ attachments }: AnnouncementTabProps) {
  const [selectedId, setSelectedId] = useState<string | null>(attachments[0]?.id ?? null)
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH)
  const [containerHeight, setContainerHeight] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const sidebarMaxWidth =
    containerWidth > 0
      ? Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, containerWidth - MIN_VIEWER_WIDTH))
      : MAX_SIDEBAR_WIDTH
  const resolvedSelectedId =
    selectedId && attachments.some((a) => a.id === selectedId) ? selectedId : attachments[0]?.id ?? null
  const resolvedSidebarWidth = Math.min(sidebarWidth, sidebarMaxWidth)
  const selected = attachments.find((a) => a.id === resolvedSelectedId)
  const isPdfSelected = isPdfAttachment(selected)
  const selectedSizeLabel = selected ? formatFileSize(selected.fileSize) : null

  useLayoutEffect(() => {
    if (!containerRef.current) return

    const element = containerRef.current
    const updateSize = () => {
      setContainerHeight(element.offsetHeight || element.clientHeight || 0)
      setContainerWidth(element.offsetWidth || element.clientWidth || 0)
    }

    updateSize()

    const observer = new ResizeObserver(updateSize)
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  const handleSidebarResize = (
    _e: React.SyntheticEvent,
    data: { node: HTMLElement; size: { width: number; height: number } }
  ) => {
    setSidebarWidth(data.size.width)
  }

  return (
    <div ref={containerRef} className="flex h-full min-h-0 w-full overflow-hidden bg-white">
      <ResizableBox
        width={resolvedSidebarWidth}
        height={containerHeight}
        axis="x"
        resizeHandles={["e"]}
        minConstraints={[MIN_SIDEBAR_WIDTH, containerHeight]}
        maxConstraints={[sidebarMaxWidth, containerHeight]}
        onResize={handleSidebarResize}
        handle={(_: unknown, ref: React.Ref<HTMLDivElement>) => <ResizeHandle ref={ref} />}
        className="relative shrink-0"
      >
        <AttachmentSidebar
          attachments={attachments}
          selectedId={resolvedSelectedId}
          onSelect={setSelectedId}
        />
      </ResizableBox>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
        {selected ? (
          <>
            <div className="flex shrink-0 items-center gap-2 border-b border-zinc-200 bg-zinc-50/80 px-3 py-1.5 text-xs">
              <span className="min-w-0 flex-1 truncate font-medium text-zinc-700">{selected.title}</span>
              {selectedSizeLabel ? (
                <span className="shrink-0 tabular-nums text-zinc-500">{selectedSizeLabel}</span>
              ) : null}
            </div>
            <div className="min-h-0 flex-1 overflow-hidden bg-white">
              {selected.pdfViewerUrl ? (
                <div className="h-full w-full overflow-hidden bg-white">
                  <object
                    data={selected.pdfViewerUrl}
                    type="application/pdf"
                    aria-label={selected.title}
                    className="h-full w-full"
                  >
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                      <p className="text-sm text-zinc-600">브라우저에서 PDF 미리보기를 표시할 수 없습니다.</p>
                      <a
                        href={selected.pdfViewerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        새 탭에서 PDF 열기
                      </a>
                    </div>
                  </object>
                </div>
              ) : !isPdfSelected ? (
                <div className="flex h-full items-center justify-center bg-white p-6">
                  <p className="text-sm text-zinc-600">
                    PDF를 제외한 나머지 파일의 미리보기는 향후 구현될 예정입니다.
                  </p>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center bg-white p-6">
                  <p className="text-sm text-zinc-600">해당 PDF 파일은 볼 수 없습니다</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">첨부파일을 선택하세요</div>
        )}
      </div>
    </div>
  )
}
