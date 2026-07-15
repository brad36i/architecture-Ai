import { create } from "zustand"
import { persist } from "zustand/middleware"

export function getProposalDraftReadyKey(projectId: string, nodeId: string) {
  return `${projectId}:${nodeId}`
}

interface ProposalDraftReadyState {
  readyByKey: Record<string, true>
  _hasHydrated: boolean
  setHasHydrated: (hydrated: boolean) => void
  markReady: (projectId: string, nodeId: string) => void
  clearReady: (projectId: string, nodeId: string) => void
  clearProject: (projectId: string) => void
}

export const useProposalDraftReadyStore = create<ProposalDraftReadyState>()(
  persist(
    (set) => ({
      readyByKey: {},
      _hasHydrated: false,
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
      markReady: (projectId, nodeId) =>
        set((state) => ({
          readyByKey: {
            ...state.readyByKey,
            [getProposalDraftReadyKey(projectId, nodeId)]: true,
          },
        })),
      clearReady: (projectId, nodeId) =>
        set((state) => {
          const next = { ...state.readyByKey }
          delete next[getProposalDraftReadyKey(projectId, nodeId)]
          return { readyByKey: next }
        }),
      clearProject: (projectId) =>
        set((state) => ({
          readyByKey: Object.fromEntries(
            Object.entries(state.readyByKey).filter(([key]) => !key.startsWith(`${projectId}:`))
          ),
        })),
    }),
    {
      name: "topic-proposal-draft-ready",
      partialize: (state) => ({ readyByKey: state.readyByKey }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
