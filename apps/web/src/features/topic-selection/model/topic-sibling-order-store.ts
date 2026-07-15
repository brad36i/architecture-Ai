"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

/** projectId → parentNodeId → 자식 topic id 순서 (화면 y 기준으로 수집, API id 정렬과 무관하게 유지) */
interface TopicSiblingOrderState {
  orderByProject: Record<string, Record<string, string[]>>
  _hasHydrated: boolean
  setHasHydrated: (hydrated: boolean) => void
  getOrder: (projectId: string, parentId: string) => string[] | undefined
  /** 현재 그래프에서 계산한 부모별 자식 순서를 병합 저장 */
  mergeOrders: (projectId: string, byParent: Record<string, string[]>) => void
  /** topic-7 → uuid 등 id 변경 시 모든 부모 배열에서 치환 */
  replaceChildId: (projectId: string, fromId: string, toId: string) => void
  clearProject: (projectId: string) => void
}

export const useTopicSiblingOrderStore = create<TopicSiblingOrderState>()(
  persist(
    (set, get) => ({
      orderByProject: {},
      _hasHydrated: false,
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
      getOrder: (projectId, parentId) => get().orderByProject[projectId]?.[parentId],
      mergeOrders: (projectId, byParent) =>
        set((state) => ({
          orderByProject: {
            ...state.orderByProject,
            [projectId]: {
              ...(state.orderByProject[projectId] ?? {}),
              ...byParent,
            },
          },
        })),
      replaceChildId: (projectId, fromId, toId) => {
        if (!fromId || !toId || fromId === toId) return
        set((state) => {
          const proj = state.orderByProject[projectId]
          if (!proj) return state
          let changed = false
          const nextProj: Record<string, string[]> = {}
          for (const [parentId, ids] of Object.entries(proj)) {
            if (!ids.includes(fromId)) {
              nextProj[parentId] = ids
              continue
            }
            changed = true
            nextProj[parentId] = ids.map((id) => (id === fromId ? toId : id))
          }
          if (!changed) return state
          return {
            orderByProject: {
              ...state.orderByProject,
              [projectId]: nextProj,
            },
          }
        })
      },
      clearProject: (projectId) =>
        set((state) => {
          const next = { ...state.orderByProject }
          delete next[projectId]
          return { orderByProject: next }
        }),
    }),
    {
      name: "topic-sibling-order",
      partialize: (state) => ({ orderByProject: state.orderByProject }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
