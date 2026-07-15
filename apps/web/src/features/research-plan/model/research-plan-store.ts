import { create } from "zustand"

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt: Date
  unifiedDiff?: string | null
}

/** Cursor 스타일 컨텍스트 참조: @연구계획서:3-5 형식 */
export interface ContextRef {
  id: string
  blockStart: number
  blockEnd: number
  preview: string
}

interface ResearchPlanStore {
  projectId: string | null
  messages: ChatMessage[]
  draft: string
  sessionId: number
  sourceNodeId: string | null
  proposalVersion: number | null
  hashlinedContent: string | null
  contextRefs: ContextRef[]
  scrollToBlock: number | null
  linePosition: number | null
  startLine: number | null
  endLine: number | null
  isChatStreaming: boolean
  progressMessage: string | null
  saveState: "idle" | "saving" | "saved" | "error"
  saveMessage: string | null
  addMessage: (msg: Omit<ChatMessage, "id" | "createdAt">) => void
  setMessages: (messages: Array<Omit<ChatMessage, "id" | "createdAt">>) => void
  setDraft: (content: string) => void
  initializeProposalDraft: (params: {
    projectId: string
    draft: string
    messages?: Array<Omit<ChatMessage, "id" | "createdAt">>
    sessionId: number
    sourceNodeId: string | null
    proposalVersion?: number | null
    hashlinedContent?: string | null
  }) => void
  hydrateProposalDraft: (params: {
    projectId: string
    draft: string
    sessionId: number
    sourceNodeId: string | null
    proposalVersion?: number | null
    hashlinedContent?: string | null
  }) => void
  appendDraft: (content: string) => void
  replaceDraftSection: (start: number, end: number, replacement: string) => void
  setProposalMeta: (params: {
    proposalVersion?: number | null
    hashlinedContent?: string | null
  }) => void
  addContextRef: (ref: Omit<ContextRef, "id">) => void
  removeContextRef: (id: string) => void
  clearContextRefs: () => void
  requestScrollToBlock: (blockIndex: number) => void
  clearScrollToBlock: () => void
  setSelectionContext: (params: {
    linePosition?: number | null
    startLine?: number | null
    endLine?: number | null
  }) => void
  setChatStreaming: (isChatStreaming: boolean) => void
  setProgressMessage: (message: string | null) => void
  setSaveState: (
    saveState: "idle" | "saving" | "saved" | "error",
    saveMessage?: string | null
  ) => void
}

export const useResearchPlanStore = create<ResearchPlanStore>()((set) => ({
  projectId: null,
  messages: [],
  draft: "",
  sessionId: 1,
  sourceNodeId: null,
  proposalVersion: null,
  hashlinedContent: null,
  contextRefs: [],
  scrollToBlock: null,
  linePosition: 1,
  startLine: null,
  endLine: null,
  isChatStreaming: false,
  progressMessage: null,
  saveState: "idle",
  saveMessage: null,

  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { ...msg, id: crypto.randomUUID(), createdAt: new Date() },
      ],
    })),

  setMessages: (messages) =>
    set({
      messages: messages.map((msg) => ({
        ...msg,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      })),
    }),

  setDraft: (content) => set({ draft: content }),

  initializeProposalDraft: ({
    projectId,
    draft,
    messages = [],
    sessionId,
    sourceNodeId,
    proposalVersion = null,
    hashlinedContent = null,
  }) =>
    set({
      projectId,
      draft,
      messages: messages.map((msg) => ({
        ...msg,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      })),
      sessionId,
      sourceNodeId,
      proposalVersion,
      hashlinedContent,
      contextRefs: [],
      scrollToBlock: null,
      linePosition: 1,
      startLine: null,
      endLine: null,
      isChatStreaming: false,
      progressMessage: null,
      saveState: "idle",
      saveMessage: null,
    }),

  hydrateProposalDraft: ({
    projectId,
    draft,
    sessionId,
    sourceNodeId,
    proposalVersion = null,
    hashlinedContent = null,
  }) =>
    set((state) => {
      const sameContext =
        state.projectId === projectId &&
        state.sessionId === sessionId &&
        state.sourceNodeId === sourceNodeId

      return {
        projectId,
        draft,
        sessionId,
        sourceNodeId,
        proposalVersion,
        hashlinedContent,
        messages: sameContext ? state.messages : [],
        contextRefs: sameContext ? state.contextRefs : [],
        scrollToBlock: sameContext ? state.scrollToBlock : null,
        linePosition: sameContext ? state.linePosition : 1,
        startLine: sameContext ? state.startLine : null,
        endLine: sameContext ? state.endLine : null,
        isChatStreaming: sameContext ? state.isChatStreaming : false,
        progressMessage: sameContext ? state.progressMessage : null,
        saveState: sameContext ? state.saveState : "idle",
        saveMessage: sameContext ? state.saveMessage : null,
      }
    }),

  appendDraft: (content) =>
    set((state) => ({
      draft: state.draft ? `${state.draft}\n\n${content}` : content,
    })),

  replaceDraftSection: (start, end, replacement) =>
    set((state) => ({
      draft: state.draft.slice(0, start) + replacement + state.draft.slice(end),
    })),

  setProposalMeta: ({ proposalVersion, hashlinedContent }) =>
    set((state) => ({
      proposalVersion:
        proposalVersion === undefined ? state.proposalVersion : proposalVersion,
      hashlinedContent:
        hashlinedContent === undefined ? state.hashlinedContent : hashlinedContent,
    })),

  addContextRef: (ref) =>
    set((state) => {
      const exists = state.contextRefs.some(
        (r) => r.blockStart === ref.blockStart && r.blockEnd === ref.blockEnd
      )
      if (exists) return state
      return {
        contextRefs: [...state.contextRefs, { ...ref, id: crypto.randomUUID() }],
      }
    }),

  removeContextRef: (id) =>
    set((state) => ({
      contextRefs: state.contextRefs.filter((r) => r.id !== id),
    })),

  clearContextRefs: () => set({ contextRefs: [] }),

  requestScrollToBlock: (blockIndex) => set({ scrollToBlock: blockIndex }),
  clearScrollToBlock: () => set({ scrollToBlock: null }),
  setSelectionContext: ({ linePosition, startLine, endLine }) =>
    set((state) => ({
      linePosition:
        linePosition === undefined ? state.linePosition : linePosition,
      startLine: startLine === undefined ? state.startLine : startLine,
      endLine: endLine === undefined ? state.endLine : endLine,
    })),
  setChatStreaming: (isChatStreaming) => set({ isChatStreaming }),
  setProgressMessage: (progressMessage) => set({ progressMessage }),
  setSaveState: (saveState, saveMessage = null) => set({ saveState, saveMessage }),
}))
