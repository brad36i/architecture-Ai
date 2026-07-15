"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import {
  AlertCircle,
  Bot,
  Check,
  Loader2,
  MessageCircle,
  Paperclip,
  X,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import {
  CHAT_PANEL_COMPOSER_MAX_INPUT_HEIGHT_PX,
  ChatPanelComposerField,
  ChatPanelComposerFooter,
  ChatPanelComposerForm,
  ChatPanelComposerSendButton,
  chatPanelComposerStackClassName,
  chatPanelComposerTextareaClassName,
} from "@/shared/ui/chat-panel-composer"
import { applyUnifiedDiffToText } from "@/features/research-plan/model/proposal-diff"
import {
  fetchProposalAgentStream,
  fetchProposalChatStream,
  getLatestAssistantChat,
  type ProposalChatEvent,
  type ProposalDoneData,
} from "@/features/research-plan/model/proposal-chat-stream"
import { useResearchPlanStore } from "@/features/research-plan/model/research-plan-store"

type ChatMode = "agent" | "ask"

export function ChatPanel() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = (params?.id as string) ?? ""
  const sessionIdParam = Number(searchParams.get("sessionId") ?? "1")
  const sessionId = Number.isFinite(sessionIdParam) && sessionIdParam > 0 ? sessionIdParam : 1
  const [input, setInput] = useState("")
  const [mode, setMode] = useState<ChatMode>("agent")
  const [appliedDiffMessageIds, setAppliedDiffMessageIds] = useState<string[]>([])
  const [typingAssistantText, setTypingAssistantText] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const typingTimerRef = useRef<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const {
    messages,
    addMessage,
    setDraft,
    contextRefs,
    removeContextRef,
    requestScrollToBlock,
    linePosition,
    startLine,
    endLine,
    isChatStreaming,
    progressMessage,
    setChatStreaming,
    setProgressMessage,
  } = useResearchPlanStore()

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "0"
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 24), CHAT_PANEL_COMPOSER_MAX_INPUT_HEIGHT_PX)}px`
    el.style.overflowY =
      el.scrollHeight > CHAT_PANEL_COMPOSER_MAX_INPUT_HEIGHT_PX ? "auto" : "hidden"
  }, [input, contextRefs.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" })
  }, [messages, progressMessage, isChatStreaming])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
      if (typingTimerRef.current != null) {
        window.clearInterval(typingTimerRef.current)
      }
    }
  }, [])

  const handleApplyDiff = (messageId: string, unifiedDiff: string) => {
    try {
      const nextDraft = applyUnifiedDiffToText(
        useResearchPlanStore.getState().draft,
        unifiedDiff
      )
      setDraft(nextDraft)
      setAppliedDiffMessageIds((prev) =>
        prev.includes(messageId) ? prev : [...prev, messageId]
      )
      addMessage({
        role: "system",
        content: "AI 수정 제안을 초안에 반영했습니다.",
      })
    } catch (error) {
      console.error("[research-plan][agent][diff-apply-error]", error)
      addMessage({
        role: "system",
        content:
          "수정 제안 diff를 초안에 반영하지 못했습니다. diff 형식을 다시 확인해 주세요.",
      })
    }
  }

  const submitMessage = async () => {
    const text = input.trim()
    if (!text || !projectId || isChatStreaming) return

    addMessage({ role: "user", content: text })
    setInput("")
    setChatStreaming(true)
    setProgressMessage(null)

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    let latestAssistantEvent: ProposalChatEvent | null = null
    let latestDoneData: ProposalDoneData | null = null
    let hasHandledError = false
    let hasRenderedAssistantMessage = false

    const startAssistantTyping = (event: ProposalChatEvent) => {
      const content = event.content?.trim()
      const unifiedDiff = event.unifiedDiff ?? null
      const hasRenderablePayload =
        Boolean(content) || Boolean(unifiedDiff && unifiedDiff.trim())

      if (!hasRenderablePayload || hasRenderedAssistantMessage) return

      if (!content || mode !== "ask") {
        hasRenderedAssistantMessage = true
        addMessage({
          role: "assistant",
          content:
            content ||
            (mode === "agent"
              ? "수정 제안이 생성되었습니다."
              : "답변이 도착했습니다."),
          unifiedDiff,
        })
        return
      }

      hasRenderedAssistantMessage = true
      setProgressMessage(null)
      setTypingAssistantText("")

      if (typingTimerRef.current != null) {
        window.clearInterval(typingTimerRef.current)
      }

      let visibleLength = 0
      const step = Math.max(2, Math.ceil(content.length / 120))

      typingTimerRef.current = window.setInterval(() => {
        visibleLength = Math.min(content.length, visibleLength + step)
        setTypingAssistantText(content.slice(0, visibleLength))

        if (visibleLength >= content.length) {
          if (typingTimerRef.current != null) {
            window.clearInterval(typingTimerRef.current)
            typingTimerRef.current = null
          }
          addMessage({
            role: "assistant",
            content,
            unifiedDiff,
          })
          setTypingAssistantText("")
        }
      }, 18)
    }

    const appendAssistantMessage = (event: ProposalChatEvent) => {
      const content = event.content?.trim()
      const unifiedDiff = event.unifiedDiff ?? null
      const hasRenderablePayload =
        Boolean(content) || Boolean(unifiedDiff && unifiedDiff.trim())

      if (!hasRenderablePayload || hasRenderedAssistantMessage) return

      startAssistantTyping(event)
    }

    try {
      const fetcher =
        mode === "agent" ? fetchProposalAgentStream : fetchProposalChatStream

      await fetcher(
        projectId,
        {
          userMessage: text,
          sessionId,
          linePosition,
          startLine,
          endLine,
        },
        {
          onProgress: (event) => {
            setProgressMessage(event.message?.trim() || null)
          },
          onChat: (event) => {
            latestAssistantEvent = event
            appendAssistantMessage(event)
          },
          onDone: (data) => {
            latestDoneData = data
          },
          onError: (message) => {
            hasHandledError = true
            addMessage({ role: "system", content: message })
          },
        },
        controller.signal
      )

      const assistantEvent =
        getLatestAssistantChat(latestDoneData) ?? latestAssistantEvent

      if (assistantEvent) {
        appendAssistantMessage(assistantEvent)
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError" && !hasHandledError) {
        addMessage({
          role: "system",
          content: "채팅 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        })
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
      setChatStreaming(false)
      setProgressMessage(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void submitMessage()
  }

  return (
    <div className="flex h-full flex-col border-l border-zinc-300 bg-zinc-200/80 text-zinc-900">
      <div className="flex h-10 shrink-0 items-center border-b border-zinc-300 bg-zinc-200/90 px-3 backdrop-blur-sm">
        <h2 className="text-sm font-medium text-zinc-800">채팅</h2>
      </div>

      <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(244,244,245,0.96),rgba(228,228,231,0.92))] p-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-zinc-500">
            <div>
              <p>건축 제안서 초안 작성에 대해 질문해 보세요.</p>
              <p className="mt-2 text-zinc-400">예: &quot;건축의 필요성부터 써줘&quot;</p>
            </div>
          </div>
        ) : (
          <ul className="space-y-4">
            {messages.map((msg) => (
              <li
                key={msg.id}
                className={`rounded-lg p-3 text-sm ${
                  msg.role === "user"
                    ? "ml-8 border border-zinc-400 bg-zinc-600 text-white"
                    : msg.role === "system"
                      ? "border border-red-300 bg-red-50 text-red-700"
                      : "mr-8 border border-zinc-300 bg-white/95 text-zinc-700 shadow-sm"
                }`}
              >
                <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                {msg.unifiedDiff ? (
                  <div className="mt-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 gap-1.5 border border-zinc-300 bg-zinc-100 px-2 text-xs text-zinc-800 hover:bg-white"
                        disabled={appliedDiffMessageIds.includes(msg.id)}
                        onClick={() => handleApplyDiff(msg.id, msg.unifiedDiff ?? "")}
                      >
                        <Check className="size-3.5" />
                        {appliedDiffMessageIds.includes(msg.id) ? "반영됨" : "확인"}
                      </Button>
                    </div>
                    <details className="rounded-md border border-zinc-300 bg-zinc-100/80 p-3 text-xs text-zinc-800">
                      <summary className="cursor-pointer select-none text-zinc-500">
                        수정 diff 보기
                      </summary>
                      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono">
                        {msg.unifiedDiff}
                      </pre>
                    </details>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {typingAssistantText ? (
          <div className="mt-4 mr-8 rounded-lg border border-zinc-300 bg-white/95 px-3 py-2 text-sm text-zinc-700 shadow-sm">
            <p className="whitespace-pre-wrap font-sans">
              {typingAssistantText}
              <span className="ml-0.5 inline-block h-4 w-2 animate-pulse rounded-sm bg-zinc-400 align-[-2px]" />
            </p>
          </div>
        ) : null}
        {isChatStreaming ? (
          <div className="mt-4 mr-8 flex items-start gap-2 rounded-lg border border-zinc-300 bg-white/90 px-3 py-2 text-sm text-zinc-600 shadow-sm">
            <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin" />
            <p className="whitespace-pre-wrap font-sans">
              {progressMessage || "응답을 생성하고 있습니다..."}
            </p>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      <ChatPanelComposerForm onSubmit={handleSubmit}>
        <div className={chatPanelComposerStackClassName}>
          <ChatPanelComposerField>
              {contextRefs.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {contextRefs.map((ref) => {
                    const label = ref.blockStart === ref.blockEnd
                      ? `건축 제안서:${ref.blockStart}`
                      : `건축 제안서:${ref.blockStart}-${ref.blockEnd}`
                    return (
                      <span
                        key={ref.id}
                        className="group flex shrink-0 items-center gap-1 rounded-md border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 hover:bg-zinc-200"
                      >
                        <button
                          type="button"
                          onClick={() => requestScrollToBlock(ref.blockStart)}
                          className="hover:text-zinc-900 hover:underline"
                          title="해당 블록으로 이동"
                        >
                          {label}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeContextRef(ref.id)
                          }}
                          className="flex items-center justify-center rounded p-0.5 text-zinc-500 opacity-0 transition-opacity hover:bg-zinc-300 hover:text-zinc-900 group-hover:opacity-100"
                          aria-label="제거"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isChatStreaming}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    void submitMessage()
                  }
                }}
                placeholder={contextRefs.length > 0 ? "메시지 입력..." : mode === "agent" ? "Agent에게 요청하세요..." : "질문을 입력하세요..."}
                rows={1}
                className={chatPanelComposerTextareaClassName}
                style={{ maxHeight: CHAT_PANEL_COMPOSER_MAX_INPUT_HEIGHT_PX }}
              />
          </ChatPanelComposerField>
          <ChatPanelComposerFooter>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setMode("agent")}
                disabled={isChatStreaming}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  mode === "agent"
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-600 hover:bg-zinc-300 hover:text-zinc-900"
                }`}
              >
                <Bot className="size-3.5" />
                Agent
              </button>
              <button
                type="button"
                onClick={() => setMode("ask")}
                disabled={isChatStreaming}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  mode === "ask"
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-600 hover:bg-zinc-300 hover:text-zinc-900"
                }`}
              >
                <MessageCircle className="size-3.5" />
                Ask
              </button>
              <button
                type="button"
                disabled
                className="rounded-md p-1.5 text-zinc-500"
                aria-label="첨부파일"
              >
                <Paperclip className="size-4" />
              </button>
            </div>
            <ChatPanelComposerSendButton
              disabled={isChatStreaming || !input.trim() || !projectId}
              pending={isChatStreaming}
            />
          </ChatPanelComposerFooter>
          {!projectId ? (
            <div className="flex items-center gap-1.5 text-xs text-red-500">
              <AlertCircle className="size-3.5" />
              프로젝트 정보를 확인할 수 없어 채팅을 보낼 수 없습니다.
            </div>
          ) : null}
        </div>
      </ChatPanelComposerForm>
    </div>
  )
}
