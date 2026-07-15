// TODO: 향후 삭제 — 임시 auth-state 스토어·persist·쿠키 연동 전부 (실제 인증으로 교체)
import { create } from "zustand"
import { persist } from "zustand/middleware"

import { syncDevAuthSessionCookie } from "@/shared/lib/dev-auth-session-cookie"

interface AuthState {
  userId: number | null
  setUserId: (id: number) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      // TODO: 향후 삭제 — 임시 쿠키 동기화
      setUserId: (id) => {
        set({ userId: id })
        syncDevAuthSessionCookie(id)
      },
      logout: () => {
        set({ userId: null })
        syncDevAuthSessionCookie(null)
      },
    }),
    {
      name: "auth-state",
      partialize: (s) => ({ userId: s.userId }),
      // TODO: 향후 삭제 — 임시 skipHydration (Radix hydration 이슈 회피, 실제 인증 시 재검토)
      skipHydration: true,
    }
  )
)

