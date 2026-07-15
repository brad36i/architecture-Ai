"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import type { Components } from "react-markdown"
import ReactMarkdown from "react-markdown"

import { useClippings } from "@/features/related-works/model/use-clippings"
import { useAsidebarStore, type NodeDetailContext } from "@/shared/stores/asidebar-store"
import { FloatingLineTabs } from "@/shared/ui/floating-line-tabs"
import { Tabs, TabsContent } from "@/shared/ui/tabs"
import { cn } from "@/shared/lib/utils"

const nodeDetailMdComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-3 mt-5 text-base font-semibold text-zinc-100 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 text-sm font-semibold text-zinc-100">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-3 text-sm font-medium text-zinc-200">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="leading-relaxed text-zinc-300">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-inside list-disc space-y-1 pl-1 text-zinc-300">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-inside list-decimal space-y-1 pl-1 text-zinc-300">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-zinc-100">{children}</strong>
  ),
  em: ({ children }) => <em className="text-zinc-200">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-zinc-500 pl-3 text-zinc-400">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const inline = !className
    if (inline) {
      return (
        <code className="rounded bg-zinc-900 px-1 py-0.5 font-mono text-xs text-zinc-200">
          {children}
        </code>
      )
    }
    return (
      <code className="font-mono text-xs text-zinc-200">{children}</code>
    )
  },
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-md bg-zinc-900 p-3 text-xs">{children}</pre>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-sky-400 underline-offset-2 hover:underline"
      target="_blank"
      rel="noreferrer noopener"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-4 border-zinc-600" />,
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm text-zinc-300">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-zinc-600">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-zinc-600 bg-zinc-900/80 px-2 py-1.5 font-medium text-zinc-200">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-zinc-700 px-2 py-1.5 align-top">{children}</td>
  ),
}

function NodeDetailMarkdown({
  source,
  emptyFallback,
}: {
  source: string
  emptyFallback: string
}) {
  const trimmed = source.trim()
  if (!trimmed) {
    return (
      <p className="text-left text-sm leading-relaxed text-zinc-500 select-text">
        {emptyFallback}
      </p>
    )
  }
  return (
    <div className="text-left text-sm leading-relaxed select-text [&_p]:mb-2 [&_p:last-child]:mb-0">
      <ReactMarkdown components={nodeDetailMdComponents}>{trimmed}</ReactMarkdown>
    </div>
  )
}

export function NodeDetailPanelContent() {
  const params = useParams()
  const projectId = (params?.id as string) ?? ""
  const { nodeDetailContext } = useAsidebarStore()

  if (!nodeDetailContext) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-zinc-500">
          노드의 <strong>상세보기</strong> 버튼을 클릭해
          <br />
          주제 내용을 확인하세요
        </p>
      </div>
    )
  }

  return (
    <NodeDetailPanelWithTabs
      key={nodeDetailContext.nodeId}
      projectId={projectId}
      nodeDetailContext={nodeDetailContext}
    />
  )
}

function NodeDetailPanelWithTabs({
  projectId,
  nodeDetailContext,
}: {
  projectId: string
  nodeDetailContext: NodeDetailContext
}) {
  const [activeTab, setActiveTab] = useState("node")
  const { label, topicSelected, displayContent, aiContent, selectedContent } =
    nodeDetailContext

  return (
    <div className="flex h-full flex-col p-4 text-zinc-200">
      <h3 className="mb-3 truncate text-sm font-semibold text-zinc-100" title={label}>
        {label}
      </h3>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
        <FloatingLineTabs
          value={activeTab}
          onValueChange={setActiveTab}
          fullWidth
          items={[
            { value: "node", label: "상세보기" },
            { value: "ai", label: "AI 추론" },
          ]}
        />
        <TabsContent value="node" className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden">
          <SelectableClipRegion projectId={projectId} className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              {topicSelected && selectedContent ? (
                <>
                  <SectionBlock
                    label="최종목표내용"
                    content={selectedContent.finalObjective}
                    limitLabel="800자 이내"
                  />
                  <SectionBlock
                    label="연구개발내용"
                    content={selectedContent.researchContent}
                    limitLabel="800자"
                  />
                  {selectedContent.expectedEffectAndPlan ? (
                    <SectionBlock
                      label="연구개발성과 활용계획 및 기대효과"
                      content={selectedContent.expectedEffectAndPlan}
                      limitLabel="600자 이내"
                    />
                  ) : null}
                </>
              ) : (
                <NodeDetailMarkdown
                  source={displayContent}
                  emptyFallback="표시된 내용이 없습니다."
                />
              )}
            </div>
          </SelectableClipRegion>
        </TabsContent>
        <TabsContent value="ai" className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden">
          <SelectableClipRegion projectId={projectId} className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              {aiContent?.detail?.trim() ? (
                <NodeDetailMarkdown
                  source={aiContent.detail}
                  emptyFallback="AI 추론 내용이 없습니다."
                />
              ) : (
                <p className="text-sm text-zinc-500">AI 추론 내용이 없습니다.</p>
              )}
            </div>
          </SelectableClipRegion>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/** 텍스트를 드래그로 선택한 뒤 우클릭 시 갈무리 컨텍스트 메뉴 */
function SelectableClipRegion({
  projectId,
  className,
  children,
}: {
  projectId: string
  className?: string
  children: React.ReactNode
}) {
  const { createClipping, createPending } = useClippings(
    projectId || undefined
  )
  const [menu, setMenu] = useState<{
    x: number
    y: number
    text: string
  } | null>(null)

  useEffect(() => {
    if (!menu) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null)
    }
    const onPointerDown = (e: PointerEvent) => {
      const el = document.querySelector("[data-clip-menu='1']")
      if (el?.contains(e.target as Node)) return
      setMenu(null)
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("pointerdown", onPointerDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("pointerdown", onPointerDown)
    }
  }, [menu])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const sel = window.getSelection()?.toString().trim()
    if (!sel) return
    e.preventDefault()
    e.stopPropagation()
    const pad = 8
    const mw = 180
    const mh = 48
    const x = Math.max(pad, Math.min(e.clientX, window.innerWidth - mw - pad))
    const y = Math.max(pad, Math.min(e.clientY, window.innerHeight - mh - pad))
    setMenu({ x, y, text: sel })
  }, [])

  const handleClip = useCallback(async () => {
    if (!menu?.text.trim() || !projectId) return
    try {
      await createClipping({
        content: menu.text,
        clippingType: "text",
        sourceAgent: "topic_selection",
      })
      useAsidebarStore.setState((s) => ({
        panelType: "갈무리",
        enhanceContext: null,
        priorResearchContext: null,
        nodeDetailContext: s.nodeDetailContext,
      }))
      setMenu(null)
      window.getSelection()?.removeAllRanges()
    } catch {
      window.alert("갈무리 저장에 실패했습니다.")
    }
  }, [createClipping, menu, projectId])

  return (
    <>
      <div
        onContextMenu={handleContextMenu}
        className={cn("select-text", className)}
      >
        {children}
      </div>
      {menu ? (
        <div
          role="menu"
          data-clip-menu="1"
          className="fixed z-[300] min-w-[168px] rounded-md border border-zinc-600 bg-zinc-800 py-1 shadow-xl"
          style={{ left: menu.x, top: menu.y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            disabled={createPending || !projectId}
            onClick={() => void handleClip()}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createPending ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-zinc-400" />
            ) : null}
            갈무리 하기
          </button>
        </div>
      ) : null}
    </>
  )
}

function SectionBlock({
  label,
  content,
  limitLabel,
}: {
  label: string
  content?: string
  limitLabel?: string
}) {
  if (!content && content !== "") return null
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-zinc-400">
        {label}
        {limitLabel && <span className="ml-1 font-normal">({limitLabel})</span>}
      </p>
      <NodeDetailMarkdown source={content ?? ""} emptyFallback="—" />
    </div>
  )
}
