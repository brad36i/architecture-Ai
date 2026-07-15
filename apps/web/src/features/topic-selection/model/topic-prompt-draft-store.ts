"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface TopicPromptDraftState {
  draftByProjectId: Record<string, string>
  _hasHydrated: boolean
  setHasHydrated: (hydrated: boolean) => void
  setDraft: (projectId: string, text: string) => void
  clearDraft: (projectId: string) => void
}

export const useTopicPromptDraftStore = create<TopicPromptDraftState>()(
  persist(
    (set) => ({
      draftByProjectId: {},
      _hasHydrated: false,
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
      setDraft: (projectId, text) =>
        set((state) => ({
          draftByProjectId: {
            ...state.draftByProjectId,
            [projectId]: text,
          },
        })),
      clearDraft: (projectId) =>
        set((state) => {
          const next = { ...state.draftByProjectId }
          delete next[projectId]
          return { draftByProjectId: next }
        }),
    }),
    {
      name: "topic-prompt-draft",
      partialize: (state) => ({ draftByProjectId: state.draftByProjectId }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
