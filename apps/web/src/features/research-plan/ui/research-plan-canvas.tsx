"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Highlight from "@tiptap/extension-highlight"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { Markdown } from "tiptap-markdown"
import {
  MessageCircle,
  Trash2,
  Send,
  HelpCircle,
  Download,
  Share2,
  MessageSquarePlus,
  Table2,
  Bookmark,
  Loader2,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { useClippings } from "@/features/related-works/model/use-clippings"
import { stashIllustrationChatPrefill } from "@/shared/lib/illustration-chat-prefill"
import { useAsidebarStore } from "@/shared/stores/asidebar-store"
import { CurrentBlockHighlight } from "@/features/research-plan/extensions/current-block-highlight"
import { Button } from "@/shared/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip"
import { Input } from "@/shared/ui/input"
import { useResearchPlanStore } from "@/features/research-plan/model/research-plan-store"

function getBlockRangeFromSelection(
  doc: { childCount: number; child: (i: number) => { nodeSize: number } },
  from: number,
  to: number
): { startBlock: number; endBlock: number } {
  let startBlock = 1
  let endBlock = 1
  let pos = 1
  for (let i = 0; i < doc.childCount; i++) {
    const node = doc.child(i)
    const end = pos + node.nodeSize
    if (from >= pos && from < end) startBlock = i + 1
    if (to > pos && to <= end) endBlock = i + 1
    else if (to > end && i === doc.childCount - 1) endBlock = doc.childCount
    pos = end
  }
  if (endBlock < startBlock) endBlock = startBlock
  return { startBlock, endBlock }
}

export function ResearchPlanCanvas() {
  const params = useParams()
  const router = useRouter()
  const projectId = (params?.id as string) ?? ""
  const {
    draft,
    setDraft,
    addMessage,
    addContextRef,
    scrollToBlock,
    clearScrollToBlock,
    setSelectionContext,
    saveState,
    saveMessage,
    sessionId,
  } = useResearchPlanStore()
  const { createClipping, createPending } = useClippings(
    projectId || undefined
  )
  const prevDraftRef = useRef(draft)
  const isInternalUpdate = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const [hasSelection, setHasSelection] = useState(false)
  const [enhanceOpen, setEnhanceOpen] = useState(false)
  const [enhanceInput, setEnhanceInput] = useState("")
  const enhanceInputRef = useRef<HTMLInputElement>(null)

  const clearMenu = useCallback(() => {
    setHasSelection(false)
    setMenuPos(null)
    setEnhanceOpen(false)
    setEnhanceInput("")
  }, [])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "내용을 입력하세요..." }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight,
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      Markdown.configure({
        html: false,
        tightLists: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      CurrentBlockHighlight,
    ],
    content: draft,
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true
      const md = (editor.storage as { markdown?: { getMarkdown: () => string } }).markdown?.getMarkdown() ?? ""
      prevDraftRef.current = md
      setDraft(md)
      queueMicrotask(() => { isInternalUpdate.current = false })
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      const { startBlock, endBlock } = getBlockRangeFromSelection(
        editor.state.doc,
        from,
        to
      )

      setSelectionContext({
        linePosition: startBlock,
        startLine: from === to ? null : startBlock,
        endLine: from === to ? null : endBlock,
      })

      if (from === to) {
        clearMenu()
        return
      }

      setHasSelection(true)
      const { view } = editor
      const startCoords = view.coordsAtPos(from)
      const endCoords = view.coordsAtPos(to)
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return
      setMenuPos({
        x: (startCoords.left + endCoords.right) / 2 - containerRect.left,
        y: startCoords.top - containerRect.top + (containerRef.current?.scrollTop ?? 0) - 8,
      })
    },
  })

  useEffect(() => {
    if (!editor || isInternalUpdate.current) return
    if (draft === prevDraftRef.current) return
    prevDraftRef.current = draft
    editor.commands.setContent(draft)
  }, [draft, editor])

  useEffect(() => {
    if (enhanceOpen) enhanceInputRef.current?.focus()
  }, [enhanceOpen])

  useEffect(() => {
    if (!editor || scrollToBlock == null) return
    const container = containerRef.current
    if (!container) return
    const blockEl = container.querySelector(
      `.tiptap > *:nth-child(${scrollToBlock})`
    ) as HTMLElement | null
    if (blockEl) {
      blockEl.scrollIntoView({ block: "center" })
      blockEl.focus?.()
    }
    clearScrollToBlock()
  }, [editor, scrollToBlock, clearScrollToBlock])

  useEffect(() => {
    if (!hasSelection) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return
      clearMenu()
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [hasSelection, clearMenu])

  const handleEnhanceSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!editor || !enhanceInput.trim()) return
      const { from, to } = editor.state.selection
      const selectedText = editor.state.doc.textBetween(from, to)
      if (!selectedText) return
      const cmd = enhanceInput.trim()
      addMessage({ role: "user", content: `[선택 영역 강화] "${selectedText.substring(0, 50)}..." 에 대해: ${cmd}` })
      editor.chain().focus().deleteSelection().insertContent(`[강화됨: "${cmd}"] ${selectedText}`).run()
      addMessage({ role: "assistant", content: "해당 영역을 강화하였습니다." })
      clearMenu()
    },
    [editor, enhanceInput, addMessage, clearMenu]
  )

  const handleDelete = useCallback(() => {
    if (!editor) return
    editor.chain().focus().deleteSelection().run()
    clearMenu()
  }, [editor, clearMenu])

  const handleAddToChat = useCallback(() => {
    if (!editor) return
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to)
    if (!selectedText) return
    const { startBlock, endBlock } = getBlockRangeFromSelection(
      editor.state.doc,
      from,
      to
    )
    addContextRef({
      blockStart: startBlock,
      blockEnd: endBlock,
      preview: selectedText.slice(0, 30) + (selectedText.length > 30 ? "…" : ""),
    })
    clearMenu()
  }, [editor, addContextRef, clearMenu])

  const handleSendToIllustrationChat = useCallback(() => {
    if (!editor || !projectId) return
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to)
    if (!selectedText.trim()) return
    stashIllustrationChatPrefill(projectId, selectedText)
    router.push(`/projects/${projectId}/diagram-table`)
    clearMenu()
  }, [editor, projectId, router, clearMenu])

  const handleClip = useCallback(async () => {
    if (!editor || !projectId) return
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to)
    if (!selectedText.trim()) return
    try {
      await createClipping({
        content: selectedText,
        clippingType: "text",
        sourceAgent: "proposal",
        sourceSessionId: String(sessionId),
      })
      useAsidebarStore.setState((s) => ({
        panelType: "갈무리",
        enhanceContext: null,
        priorResearchContext: null,
        nodeDetailContext: s.nodeDetailContext,
      }))
      clearMenu()
    } catch {
      window.alert("갈무리 저장에 실패했습니다.")
    }
  }, [editor, projectId, sessionId, createClipping, clearMenu])


  return (
    <div className="research-plan-canvas relative flex h-full flex-col">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-zinc-200 px-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-zinc-800">건축 제안서 에디터</h2>
          {saveMessage ? (
            <span
              className={`text-xs ${
                saveState === "error" ? "text-red-500" : "text-zinc-500"
              }`}
            >
              {saveMessage}
            </span>
          ) : null}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-zinc-400 hover:text-zinc-600"
                  aria-label="마크다운 단축키"
                >
                  <HelpCircle className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                # 제목, ## 소제목, - 목록, 1. 번호, [ ] 체크, --- 구분선, **굵게**, *기울임*
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2 text-xs"
            onClick={() => toast("내보내기는 구현 예정이에요.")}
          >
            <Download className="size-3.5" />
            내보내기
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2 text-xs"
            onClick={() => toast("공유하기는 구현 예정이에요.")}
          >
            <Share2 className="size-3.5" />
            공유하기
          </Button>
        </div>
      </div>

      <div ref={containerRef} className="tiptap-wrapper research-plan-with-lines relative flex-1 overflow-y-auto">
          <EditorContent editor={editor} />

        {hasSelection && menuPos && (
          <div
            ref={menuRef}
            className="absolute z-20 flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg"
            style={{ left: menuPos.x, top: menuPos.y, transform: "translate(-50%, -100%)" }}
          >
            <button type="button" onClick={() => setEnhanceOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-100">
              <MessageCircle className="size-4 shrink-0" />내용강화
            </button>
            <button type="button" onClick={handleAddToChat}
              className="flex items-center gap-2 px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-100">
              <MessageSquarePlus className="size-4 shrink-0" />채팅창에 추가
            </button>
            <button type="button" onClick={handleSendToIllustrationChat}
              className="flex items-center gap-2 px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-100">
              <Table2 className="size-4 shrink-0" />도식/표 생성
            </button>
            <button
              type="button"
              onClick={() => void handleClip()}
              disabled={createPending}
              className="flex items-center gap-2 px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createPending ? (
                <Loader2 className="size-4 shrink-0 animate-spin" />
              ) : (
                <Bookmark className="size-4 shrink-0" />
              )}
              갈무리 하기
            </button>
            <button type="button" onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-100">
              <Trash2 className="size-4 shrink-0" />삭제
            </button>
            {enhanceOpen && (
              <form onSubmit={handleEnhanceSubmit} className="flex gap-2 border-t border-zinc-200 p-2">
                <Input ref={enhanceInputRef} value={enhanceInput} onChange={(e) => setEnhanceInput(e.target.value)}
                  placeholder="예: 더 구체적으로 써줘" className="h-8 text-sm" />
                <Button type="submit" size="sm" className="h-8 shrink-0 px-2">
                  <Send className="size-4" />
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
