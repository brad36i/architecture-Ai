"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import {
  CHAT_PANEL_COMPOSER_MAX_INPUT_HEIGHT_PX,
  ChatPanelComposerField,
  ChatPanelComposerFooter,
  ChatPanelComposerForm,
  ChatPanelComposerSendButton,
  chatPanelComposerStackClassName,
  chatPanelComposerTextareaClassName,
} from "@/shared/ui/chat-panel-composer"
import { Input } from "@/shared/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import {
  DEFAULT_MAX_CRITIC_ROUNDS,
  parseMaxCriticRoundsInput,
} from "../model/illustration-chat-schema"
import {
  DIAGRAM_PROMPT_PRESETS,
  type DiagramChatMessage,
  type DiagramPromptPresetId,
  type DiagramStreamProgress,
} from "../model/illustration-stream"
import { usePathname } from "next/navigation"
import {
  clearIllustrationChatPrefill,
  peekIllustrationChatPrefill,
} from "@/shared/lib/illustration-chat-prefill"

interface DiagramChatPanelProps {
  messages: DiagramChatMessage[]
  progressSteps: DiagramStreamProgress[]
  isStreaming: boolean
  sessionReady: boolean
  projectId: string
  onSendMessage: (payload: {
    content: string
    presetId: DiagramPromptPresetId
    maxCriticRounds: number
  }) => void
}

export function DiagramChatPanel({
  messages,
  progressSteps,
  isStreaming,
  sessionReady,
  projectId,
  onSendMessage,
}: DiagramChatPanelProps) {
  const [input, setInput] = useState("")
  const [maxCriticRoundsInput, setMaxCriticRoundsInput] = useState(
    String(DEFAULT_MAX_CRITIC_ROUNDS)
  )
  const [maxCriticRoundsError, setMaxCriticRoundsError] = useState<string | null>(null)
  const [presetId, setPresetId] = useState<DiagramPromptPresetId>("diagram")
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pathname = usePathname()

  const selectedPreset = DIAGRAM_PROMPT_PRESETS.find((p) => p.id === presetId)

  useLayoutEffect(() => {
    if (!projectId) return
    const text = peekIllustrationChatPrefill(projectId)
    if (!text) return
    const clearId = window.setTimeout(() => clearIllustrationChatPrefill(), 0)
    queueMicrotask(() => setInput(text))
    return () => window.clearTimeout(clearId)
  }, [projectId, pathname])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, progressSteps])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "0"
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 24), CHAT_PANEL_COMPOSER_MAX_INPUT_HEIGHT_PX)}px`
    el.style.overflowY =
      el.scrollHeight > CHAT_PANEL_COMPOSER_MAX_INPUT_HEIGHT_PX ? "auto" : "hidden"
  }, [input])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isStreaming || !sessionReady) return

    const parsed = parseMaxCriticRoundsInput(maxCriticRoundsInput)
    if (!parsed.success) {
      setMaxCriticRoundsError(parsed.error)
      return
    }
    setMaxCriticRoundsError(null)

    onSendMessage({ content: text, presetId, maxCriticRounds: parsed.value })
    setInput("")
  }

  return (
    <div className="flex h-full flex-col border-l border-zinc-300 bg-zinc-200/80 text-zinc-900">
      <div className="flex h-10 shrink-0 items-center border-b border-zinc-300 bg-zinc-200/90 px-3 backdrop-blur-sm">
        <h2 className="text-sm font-medium text-zinc-800">도식/표 채팅</h2>
      </div>

      <div className="shrink-0 border-b border-zinc-300 bg-zinc-200/90 px-3 py-2">
        <Select
          value={presetId}
          onValueChange={(value) => setPresetId(value as DiagramPromptPresetId)}
          disabled={isStreaming || !sessionReady}
        >
          <SelectTrigger className="h-8 w-full border-zinc-300 bg-white/95 text-sm shadow-xs">
            <SelectValue placeholder="시각 유형" />
          </SelectTrigger>
          <SelectContent>
            {DIAGRAM_PROMPT_PRESETS.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(244,244,245,0.96),rgba(228,228,231,0.92))] p-3">
        {progressSteps.length > 0 ? (
          <div className="mb-4 mr-8 rounded-lg border border-zinc-300 bg-white/90 px-3 py-2.5 text-sm text-zinc-600 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-700">
              {isStreaming ? (
                <Loader2 className="size-3.5 shrink-0 animate-spin text-zinc-500" />
              ) : (
                <CheckCircle2 className="size-3.5 shrink-0 text-zinc-500" />
              )}
              {isStreaming ? "생성 파이프라인" : "파이프라인 완료"}
            </div>
            <ul className="space-y-1.5">
              {progressSteps.map((step, index) => (
                <li
                  key={step.step || `${step.message}-${index}`}
                  className="flex items-start gap-2 rounded-md px-1.5 py-1 text-xs text-zinc-600"
                >
                  {step.done ? (
                    <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-zinc-500" />
                  ) : (
                    <Loader2 className="mt-0.5 size-3 shrink-0 animate-spin text-zinc-400" />
                  )}
                  <span className="leading-snug">{step.message}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {messages.length === 0 ? (
          <div className="flex h-full min-h-[200px] items-center justify-center text-center text-sm text-zinc-500">
            <div>
              <p>유형을 선택한 뒤 요청을 입력하세요.</p>
              <p className="mt-2 text-zinc-400">
                예: &quot;연구 방법론을 플로우차트로 정리해 줘&quot;
              </p>
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
                <pre className="whitespace-pre-wrap font-sans leading-relaxed">{msg.content}</pre>
              </li>
            ))}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatPanelComposerForm onSubmit={handleSubmit}>
        <div className={chatPanelComposerStackClassName}>
          <ChatPanelComposerField>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder={
                selectedPreset ? `${selectedPreset.label} 요청 입력…` : "요청 입력…"
              }
              disabled={isStreaming || !sessionReady}
              rows={1}
              className={chatPanelComposerTextareaClassName}
              style={{ maxHeight: CHAT_PANEL_COMPOSER_MAX_INPUT_HEIGHT_PX }}
            />
          </ChatPanelComposerField>
          <ChatPanelComposerFooter>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <label
                htmlFor="diagram-max-critic-rounds"
                className="shrink-0 text-xs font-medium text-zinc-600"
              >
                크리틱
              </label>
              <Input
                id="diagram-max-critic-rounds"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={maxCriticRoundsInput}
                onChange={(e) => {
                  setMaxCriticRoundsInput(e.target.value)
                  setMaxCriticRoundsError(null)
                }}
                disabled={isStreaming || !sessionReady}
                className="h-8 min-h-8 w-14 shrink-0 border-zinc-200 px-2 text-center text-sm"
                placeholder={String(DEFAULT_MAX_CRITIC_ROUNDS)}
                aria-invalid={Boolean(maxCriticRoundsError)}
              />
              <span className="hidden text-xs text-zinc-400 sm:inline">
                0~10 · 비우면 {DEFAULT_MAX_CRITIC_ROUNDS}
              </span>
            </div>
            <ChatPanelComposerSendButton
              disabled={!input.trim() || isStreaming || !sessionReady}
              pending={isStreaming}
            />
          </ChatPanelComposerFooter>
          {maxCriticRoundsError ? (
            <p className="text-xs text-red-600">{maxCriticRoundsError}</p>
          ) : (
            <p className="text-xs text-zinc-400 sm:hidden">크리틱 0~10 (비우면 {DEFAULT_MAX_CRITIC_ROUNDS})</p>
          )}
          {!projectId ? (
            <div className="flex items-center gap-1.5 text-xs text-red-500">
              <AlertCircle className="size-3.5" />
              프로젝트 정보를 확인할 수 없어 요청을 보낼 수 없습니다.
            </div>
          ) : null}
        </div>
      </ChatPanelComposerForm>
    </div>
  )
}
