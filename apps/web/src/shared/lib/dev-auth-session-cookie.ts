// TODO: 향후 삭제 — 임시 세션 쿠키·파서 전부 (실제 세션/HttpOnly 쿠키로 교체)

export const DEV_AUTH_SESSION_COOKIE = 'ezrnd_dev_auth' as const

// TODO: 향후 삭제 — 임시 쿠키 파싱
export function parseDevAuthSessionUserId(value: string | undefined): number | null {
  if (value == null || value === '') return null
  const id = Number.parseInt(value, 10)
  return Number.isFinite(id) && id > 0 ? id : null
}

// TODO: 향후 삭제 — 클라이언트 document.cookie 동기화 (임시)
/** 브라우저에서만 호출 — 로그인 상태를 미들웨어가 읽을 수 있게 쿠키 설정 */
export function syncDevAuthSessionCookie(userId: number | null): void {
  if (typeof document === 'undefined') return
  const maxAge = userId != null ? 60 * 60 * 24 * 30 : 0
  const value = userId != null ? String(userId) : ''
  document.cookie = `${DEV_AUTH_SESSION_COOKIE}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
}
