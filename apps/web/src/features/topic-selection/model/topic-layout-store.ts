"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface TopicNodePosition {
  x: number
  y: number
}

function arePositionsEqual(
  left: Record<string, TopicNodePosition> | undefined,
  right: Record<string, TopicNodePosition>
) {
  if (!left) return false

  const leftEntries = Object.entries(left)
  const rightEntries = Object.entries(right)
  if (leftEntries.length !== rightEntries.length) return false

  return rightEntries.every(([nodeId, position]) => {
    const existing = left[nodeId]
    return existing?.x === position.x && existing?.y === position.y
  })
}

interface TopicLayoutState {
  positionsByProject: Record<string, Record<string, TopicNodePosition>>
  _hasHydrated: boolean
  setHasHydrated: (hydrated: boolean) => void
  setProjectPositions: (
    projectId: string,
    positions: Record<string, TopicNodePosition>
  ) => void
  moveNodePosition: (projectId: string, fromNodeId: string, toNodeId: string) => void
}

export const useTopicLayoutStore = create<TopicLayoutState>()(
  persist(
    (set) => ({
      positionsByProject: {},
      _hasHydrated: false,
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
      setProjectPositions: (projectId, positions) =>
        set((state) => {
          if (arePositionsEqual(state.positionsByProject[projectId], positions)) {
            return state
          }

          return {
            positionsByProject: {
              ...state.positionsByProject,
              [projectId]: positions,
            },
          }
        }),
      moveNodePosition: (projectId, fromNodeId, toNodeId) =>
        set((state) => {
          const projectPositions = state.positionsByProject[projectId]
          if (!projectPositions || fromNodeId === toNodeId || !projectPositions[fromNodeId]) {
            return state
          }

          const nextProjectPositions = { ...projectPositions }
          nextProjectPositions[toNodeId] = nextProjectPositions[fromNodeId]
          delete nextProjectPositions[fromNodeId]

          return {
            positionsByProject: {
              ...state.positionsByProject,
              [projectId]: nextProjectPositions,
            },
          }
        }),
    }),
    {
      name: "topic-layout-positions",
      partialize: (state) => ({ positionsByProject: state.positionsByProject }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
