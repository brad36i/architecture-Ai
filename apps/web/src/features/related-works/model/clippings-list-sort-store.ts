import { create } from "zustand"

/** OpenAPI list clippings `sort` */
export type ClippingListSortParam = "-created_at" | "created_at"

interface ClippingsListSortState {
  sort: ClippingListSortParam
  setSort: (sort: ClippingListSortParam) => void
}

export const useClippingsListSortStore = create<ClippingsListSortState>((set) => ({
  sort: "-created_at",
  setSort: (sort) => set({ sort }),
}))
