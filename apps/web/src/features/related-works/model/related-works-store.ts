import { create } from "zustand"
import type { SearchResult } from "./types"

interface RelatedWorksState {
  selectedHistoryId: string | null
  previewItem: SearchResult | null

  setSelectedHistory: (id: string | null) => void
  setPreviewItem: (item: SearchResult | null) => void
}

export const useRelatedWorksStore = create<RelatedWorksState>()((set) => ({
  selectedHistoryId: null,
  previewItem: null,

  setSelectedHistory: (id) => set({ selectedHistoryId: id }),
  setPreviewItem: (item) => set({ previewItem: item }),
}))
