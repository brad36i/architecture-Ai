"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

/** projectId → topic 자식 id → 실제 부모 노드 id (엣지 기준). API가 루트로만 parent를 줄 때 트리/배치 보정에 사용 */
interface TopicParentOverrideState {
  parentByChildByProject: Record<string, Record<string, string>>
  _hasHydrated: boolean
  setHasHydrated: (hydrated: boolean) => void
  getParentMap: (projectId: string) => Record<string, string>
  /** 현재 그래프의 토픽 incoming 엣지로 맵 전체를 갱신 */
  setParentMapFromGraph: (projectId: string, map: Record<string, string>) => void
  /** refetch가 effect보다 빠를 때를 대비한 단일 항목 갱신 */
  setParent: (projectId: string, childId: string, parentId: string) => void
  replaceChildId: (projectId: string, fromId: string, toId: string) => void
  clearProject: (projectId: string) => void
}

export const useTopicParentOverrideStore = create<TopicParentOverrideState>()(
  persist(
    (set, get) => ({
      parentByChildByProject: {},
      _hasHydrated: false,
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
      getParentMap: (projectId) => get().parentByChildByProject[projectId] ?? {},
      setParentMapFromGraph: (projectId, map) =>
        set((state) => ({
          parentByChildByProject: {
            ...state.parentByChildByProject,
            [projectId]: { ...map },
          },
        })),
      setParent: (projectId, childId, parentId) =>
        set((state) => {
          const prev = state.parentByChildByProject[projectId] ?? {}
          if (prev[childId] === parentId) return state
          return {
            parentByChildByProject: {
              ...state.parentByChildByProject,
              [projectId]: { ...prev, [childId]: parentId },
            },
          }
        }),
      replaceChildId: (projectId, fromId, toId) => {
        if (!fromId || !toId || fromId === toId) return
        set((state) => {
          const prev = state.parentByChildByProject[projectId]
          if (!prev || prev[fromId] === undefined) return state
          const next = { ...prev, [toId]: prev[fromId] }
          delete next[fromId]
          return {
            parentByChildByProject: {
              ...state.parentByChildByProject,
              [projectId]: next,
            },
          }
        })
      },
      clearProject: (projectId) =>
        set((state) => {
          const next = { ...state.parentByChildByProject }
          delete next[projectId]
          return { parentByChildByProject: next }
        }),
    }),
    {
      name: "topic-parent-override",
      partialize: (state) => ({ parentByChildByProject: state.parentByChildByProject }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
