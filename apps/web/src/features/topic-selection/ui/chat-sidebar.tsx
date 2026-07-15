"use client"

import { useState, useRef, useEffect, createContext, use } from "react"

// ============================================================================
// Headless Component: 로직만 담당하는 훅
// ============================================================================

interface UseChatSidebarProps {
  onSend: (message: string) => void
  autoFocus?: boolean
}

function useChatSidebar({ onSend, autoFocus = true }: UseChatSidebarProps) {
  const [message, setMessage] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus()
    }
  }, [autoFocus])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      onSend(message.trim())
      setMessage("")
    }
  }

  return {
    message,
    setMessage,
    inputRef,
    handleSubmit,
    canSubmit: message.trim().length > 0,
  }
}

// ============================================================================
// Compound Component: state/actions/meta interface
// ============================================================================

type Variant = "standalone" | "embedded"

interface ChatSidebarState {
  variant: Variant
  selectedNodeLabel: string
  message: string
  canSubmit: boolean
}

interface ChatSidebarActions {
  onClose: () => void
  setMessage: (msg: string) => void
  handleSubmit: (e: React.FormEvent) => void
}

interface ChatSidebarContextValue {
  state: ChatSidebarState
  actions: ChatSidebarActions
  inputRef: React.RefObject<HTMLInputElement | null>
}

const ChatSidebarContext = createContext<ChatSidebarContextValue | null>(null)

function useChatSidebarContext() {
  const ctx = use(ChatSidebarContext)
  if (!ctx) {
    throw new Error("ChatSidebar 컴포넌트는 ChatSidebar.Root 내부에서 사용해야 합니다")
  }
  return ctx
}

// ============================================================================
// Root: Context Provider
// ============================================================================

interface ChatSidebarRootProps {
  variant?: Variant
  selectedNodeLabel: string
  onClose: () => void
  onSend: (message: string) => void
  children: React.ReactNode
}

function ChatSidebarRoot({
  variant = "standalone",
  selectedNodeLabel,
  onClose,
  onSend,
  children,
}: ChatSidebarRootProps) {
  const chatLogic = useChatSidebar({ onSend })
  const value: ChatSidebarContextValue = {
    state: { variant, selectedNodeLabel, message: chatLogic.message, canSubmit: chatLogic.canSubmit },
    actions: { onClose, setMessage: chatLogic.setMessage, handleSubmit: chatLogic.handleSubmit },
    inputRef: chatLogic.inputRef,
  }

  return (
    <ChatSidebarContext.Provider value={value}>
      <div className="flex h-full flex-col">{children}</div>
    </ChatSidebarContext.Provider>
  )
}

// ============================================================================
// Header
// ============================================================================

function ChatSidebarHeader() {
  const { state, actions } = useChatSidebarContext()
  const isDark = state.variant === "embedded"

  const titleCls = isDark
    ? "text-sm font-medium text-zinc-200"
    : "text-sm font-medium leading-snug text-zinc-800"

  return (
    <div
      className={
        isDark
          ? "mb-2"
          : "sticky top-0 flex items-start justify-between border-b border-zinc-200 bg-white px-4 py-4"
      }
    >
      {!isDark && (
        <button
          type="button"
          onClick={actions.onClose}
          className="mb-2 border-none bg-transparent p-0 text-lg text-zinc-500 transition-colors hover:text-zinc-800"
        >
          ×
        </button>
      )}
      <h2 className={titleCls}>{state.selectedNodeLabel}</h2>
    </div>
  )
}

// ============================================================================
// Content
// ============================================================================

interface ChatSidebarContentProps {
  children: React.ReactNode
}

function ChatSidebarContent({ children }: ChatSidebarContentProps) {
  const { state } = useChatSidebarContext()
  const isDark = state.variant === "embedded"

  const contentCls = isDark ? "flex flex-col gap-4" : "flex-1 space-y-5 px-4 py-4"

  return <div className={contentCls}>{children}</div>
}

// ============================================================================
// Section: 가설 검토 섹션
// ============================================================================

interface ChatSidebarSectionProps {
  title: string
  children: React.ReactNode
}

function ChatSidebarSection({ title, children }: ChatSidebarSectionProps) {
  const { state } = useChatSidebarContext()
  const isDark = state.variant === "embedded"
  const sectionCls = isDark ? "text-zinc-400" : "text-zinc-600"

  return (
    <div>
      <h3 className={`mb-3 text-xs font-semibold uppercase tracking-wider ${sectionCls}`}>
        {title}
      </h3>
      {children}
    </div>
  )
}

// ============================================================================
// SectionItem: 개별 항목 (배경 근거, 메커니즘 등)
// ============================================================================

interface ChatSidebarSectionItemProps {
  title: string
  children: React.ReactNode
}

function ChatSidebarSectionItem({ title, children }: ChatSidebarSectionItemProps) {
  const { state } = useChatSidebarContext()
  const isDark = state.variant === "embedded"
  const sectionCls = isDark ? "text-zinc-400" : "text-zinc-600"
  const textCls = isDark ? "text-zinc-400" : "text-zinc-500"

  return (
    <div className="mb-4">
      <h4 className={`mb-1.5 text-[11px] font-semibold ${sectionCls}`}>{title}</h4>
      <p className={`m-0 text-[11px] leading-relaxed ${textCls}`}>{children}</p>
    </div>
  )
}

// ============================================================================
// Source: 출처 카드
// ============================================================================

interface ChatSidebarSourceProps {
  journal: string
  title: string
  date: string
}

function ChatSidebarSource({ journal, title, date }: ChatSidebarSourceProps) {
  const { state } = useChatSidebarContext()
  const isDark = state.variant === "embedded"
  const sectionCls = isDark ? "text-zinc-400" : "text-zinc-600"
  const textCls = isDark ? "text-zinc-400" : "text-zinc-500"

  return (
    <div>
      <h4 className={`mb-2 text-[11px] font-semibold ${sectionCls}`}>출처</h4>
      <div
        className={
          isDark
            ? "rounded border border-zinc-600 bg-zinc-700/30 p-2.5"
            : "rounded border border-zinc-200 bg-zinc-50 p-2.5"
        }
      >
        <p className={`mb-0.5 text-[10px] font-semibold ${sectionCls}`}>{journal}</p>
        <p className={`mb-0.5 text-[10px] leading-snug ${textCls}`}>{title}</p>
        <p className={isDark ? "text-[9px] text-zinc-500" : "text-[9px] text-zinc-400"}>{date}</p>
      </div>
    </div>
  )
}

// ============================================================================
// Input: 메시지 입력 폼
// ============================================================================

interface ChatSidebarInputProps {
  placeholder?: string
}

function ChatSidebarInput({ placeholder = "가설을 발전시킬 방향을 더해 보세요" }: ChatSidebarInputProps) {
  const { state, actions, inputRef } = useChatSidebarContext()
  const isDark = state.variant === "embedded"

  const inputCls = isDark
    ? "flex-1 rounded border border-zinc-600 bg-zinc-700/50 px-3 py-2 text-[11px] text-zinc-200 outline-none placeholder:text-zinc-500"
    : "flex-1 rounded border border-zinc-300 bg-white px-3 py-2 text-[11px] text-zinc-800 outline-none placeholder:text-zinc-400"

  return (
    <div
      className={
        isDark
          ? "mt-auto border-t border-zinc-600 pt-4"
          : "sticky bottom-0 border-t border-zinc-200 bg-white p-4"
      }
    >
      <form onSubmit={actions.handleSubmit}>
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={state.message}
            onChange={(e) => actions.setMessage(e.target.value)}
            placeholder={placeholder}
            className={inputCls}
          />
          <button
            type="submit"
            disabled={!state.canSubmit}
            className="rounded border-none bg-indigo-500 px-4 py-2 text-[11px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-zinc-600"
          >
            전송
          </button>
        </div>
      </form>
    </div>
  )
}

// ============================================================================
// Compound Component 조합
// ============================================================================

export const ChatSidebar = Object.assign(ChatSidebarRoot, {
  Header: ChatSidebarHeader,
  Content: ChatSidebarContent,
  Section: ChatSidebarSection,
  SectionItem: ChatSidebarSectionItem,
  Source: ChatSidebarSource,
  Input: ChatSidebarInput,
})

// ============================================================================
// 기존 API 호환 래퍼 (레거시 코드 지원)
// ============================================================================

interface TopicChatSidebarContentProps {
  selectedNodeLabel: string
  onClose: () => void
  onSend: (message: string) => void
  variant?: "standalone" | "embedded"
}

export function TopicChatSidebarContent({
  selectedNodeLabel,
  onClose,
  onSend,
  variant = "standalone",
}: TopicChatSidebarContentProps) {
  return (
    <ChatSidebar
      variant={variant}
      selectedNodeLabel={selectedNodeLabel}
      onClose={onClose}
      onSend={onSend}
    >
      <ChatSidebar.Header />
      <ChatSidebar.Content>
        <ChatSidebar.Section title="가설 검토">
          <ChatSidebar.SectionItem title="배경 근거">
            컴퓨터 비전 기술을 활용한 PPE 감시 시스템의 효과성에 대한 선행 연구 결과를 바탕으로 합니다.
          </ChatSidebar.SectionItem>

          <ChatSidebar.SectionItem title="메커니즘">
            실시간 모니터링을 통해 작업자의 PPE 착용 상태를 감지하고, 미착용 시 즉시 경보를 발송하여 안전
            준수율을 향상시킵니다.
          </ChatSidebar.SectionItem>

          <ChatSidebar.SectionItem title="기대 결과">
            PPE 준수율 15%p 이상 상승, 근접사고 및 사고 발생률 20% 이상 감소, 안전기후 점수 향상.
          </ChatSidebar.SectionItem>

          <ChatSidebar.Source
            journal="Frontiers in Built Environment"
            title="Detection of Personal Protective Equipment (PPE) Compliance on Construction Site Using Computer Vision Based Deep Learning Techniques"
            date="Sep 24, 2020"
          />
        </ChatSidebar.Section>
      </ChatSidebar.Content>
      <ChatSidebar.Input />
    </ChatSidebar>
  )
}

interface ChatSidebarProps {
  isOpen: boolean
  selectedNodeLabel: string
  onClose: () => void
  onSend: (message: string) => void
}

export function TopicChatSidebar({
  isOpen,
  selectedNodeLabel,
  onClose,
  onSend,
}: ChatSidebarProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed right-0 top-0 z-1000 flex h-full w-[336px] flex-col overflow-y-auto border-l border-zinc-200 bg-white shadow-lg"
      style={{ top: 0 }}
    >
      <TopicChatSidebarContent
        selectedNodeLabel={selectedNodeLabel}
        onClose={onClose}
        onSend={onSend}
        variant="standalone"
      />
    </div>
  )
}
