"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { useState } from "react"

// TODO: 향후 삭제 — DevAuthSessionCookiePrune 임시 마운트
import { DevAuthSessionCookiePrune } from "@/shared/auth/dev-auth-session-cookie-prune"
import { Toaster } from "@/shared/ui/sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1분
            gcTime: 5 * 60 * 1000, // 5분 (이전 cacheTime)
            refetchOnWindowFocus: false,
            retry: 1,
            // 메모리 누수 방지
            structuralSharing: true,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  )

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        {/* TODO: 향후 삭제 — 임시 인증 쿠키 정렬 */}
        <DevAuthSessionCookiePrune />
        {children}
        <Toaster position="top-center" />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
