'use client'

// TODO: 향후 삭제 — 임시 useAuthMe·useAuthStore 연동
import { useAuthStore } from '@/shared/stores/auth-store'

export function useAuthMe() {
  const userId = useAuthStore((s) => s.userId)
  return { isLoggedIn: userId != null, userId } as const
}
