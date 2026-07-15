import { create } from "zustand"
import { persist } from "zustand/middleware"

const DEFAULT_SIDEBAR_WIDTH = 320
const MIN_SIDEBAR_WIDTH = 240
const MAX_SIDEBAR_WIDTH = 520

interface SidebarState {
  sidebarWidth: number
  _hasHydrated: boolean
  setHasHydrated: (hydrated: boolean) => void
  setSidebarWidth: (width: number) => void
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
      _hasHydrated: false,
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
      setSidebarWidth: (width) =>
        set({
          sidebarWidth: Math.min(
            MAX_SIDEBAR_WIDTH,
            Math.max(MIN_SIDEBAR_WIDTH, width)
          ),
        }),
    }),
    {
      name: "sidebar-state",
      partialize: (s) => ({
        sidebarWidth: s.sidebarWidth,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

export {
  DEFAULT_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
}
