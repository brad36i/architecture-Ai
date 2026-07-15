// TODO: 향후 삭제 — 임시 getDevAuthMe·쿠키 기반 인증 판별 전부
import type { NextRequest } from 'next/server'

import {
  DEV_AUTH_SESSION_COOKIE,
  parseDevAuthSessionUserId,
} from '@/shared/lib/dev-auth-session-cookie'

export function getDevAuthMe(request: NextRequest) {
  const raw = request.cookies.get(DEV_AUTH_SESSION_COOKIE)?.value
  const userId = parseDevAuthSessionUserId(raw)
  return { isLoggedIn: userId != null, userId } as const
}
