import { create } from "zustand"
import { persist } from "zustand/middleware"

const DEFAULT_PANEL_WIDTH = 380
const MIN_PANEL_WIDTH = 220
const MAX_PANEL_WIDTH = 560

export type AsidebarPanelType =
  | "파일"
  | "갈무리"
  | "메모리"
  | "미리보기"
  | "할일"
  | "주제보강"
  | "문헌상세"
  | "전체요약"
  | "선행연구"
  | "노드상세"
  | null

interface EnhanceContext {
  nodeId: string
  nodeLabel: string
}

export interface PriorResearchContext {
  /** React Flow 노드 id — 선행연구 조사 `focusNode` 쿼리에 사용 */
  nodeId: string
  /** 백엔드 토픽 노드 id — `GET .../topics/{node_id}/prior/research` 경로 */
  backendTopicNodeId: string
}

export interface NodeDetailContext {
  nodeId: string
  label: string
  topicSelected: boolean
  displayContent: string
  /** 백엔드 `detail` — AI 추론 탭 전용 */
  aiContent?: {
    detail?: string
  }
  selectedContent?: {
    finalObjective?: string
    researchContent?: string
    expectedEffectAndPlan?: string
  }
}

interface AsidebarState {
  panelWidth: number
  panelType: AsidebarPanelType
  _hasHydrated: boolean
  setHasHydrated: (hydrated: boolean) => void
  enhanceContext: EnhanceContext | null
  priorResearchContext: PriorResearchContext | null
  nodeDetailContext: NodeDetailContext | null
  setPanelWidth: (width: number) => void
  openPanel: (
    type:
      | "파일"
      | "갈무리"
      | "메모리"
      | "미리보기"
      | "할일"
      | "문헌상세"
      | "전체요약"
      | "선행연구"
      | "노드상세"
  ) => void
  openEnhance: (ctx: EnhanceContext) => void
  openPriorResearch: (ctx: PriorResearchContext) => void
  openNodeDetail: (ctx: NodeDetailContext) => void
  closePanel: () => void
}

export const useAsidebarStore = create<AsidebarState>()(
  persist(
    (set) => ({
      panelWidth: DEFAULT_PANEL_WIDTH,
      panelType: null,
      _hasHydrated: false,
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
      enhanceContext: null,
      priorResearchContext: null,
      nodeDetailContext: null,
      setPanelWidth: (width) =>
        set({
          panelWidth: Math.min(
            MAX_PANEL_WIDTH,
            Math.max(MIN_PANEL_WIDTH, width)
          ),
        }),
      openPanel: (type) =>
        set((s) => {
          const closing = s.panelType === type
          if (closing) {
            return {
              panelType: null,
              enhanceContext: null,
              priorResearchContext: null,
              nodeDetailContext: null,
            }
          }
          let nextPrior: PriorResearchContext | null = null
          if (
            type === "문헌상세" &&
            s.panelType === "선행연구" &&
            s.priorResearchContext != null
          ) {
            nextPrior = s.priorResearchContext
          } else if (type === "선행연구") {
            nextPrior = s.priorResearchContext
          }
          return {
            panelType: type,
            enhanceContext: null,
            priorResearchContext: nextPrior,
            nodeDetailContext: type === "노드상세" ? s.nodeDetailContext : null,
          }
        }),
      openEnhance: (ctx) =>
        set({
          panelType: "주제보강",
          enhanceContext: ctx,
          priorResearchContext: null,
        }),
      openPriorResearch: (ctx) =>
        set({
          panelType: "선행연구",
          enhanceContext: null,
          priorResearchContext: ctx,
          nodeDetailContext: null,
        }),
      openNodeDetail: (ctx) =>
        set({
          panelType: "노드상세",
          enhanceContext: null,
          priorResearchContext: null,
          nodeDetailContext: ctx,
        }),
      closePanel: () =>
        set({ panelType: null, enhanceContext: null, priorResearchContext: null, nodeDetailContext: null }),
    }),
    {
      name: "asidebar-panel",
      partialize: (s) => ({ panelWidth: s.panelWidth }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

export { DEFAULT_PANEL_WIDTH, MIN_PANEL_WIDTH, MAX_PANEL_WIDTH }
