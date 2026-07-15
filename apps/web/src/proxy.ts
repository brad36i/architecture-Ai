import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { getDevAuthMe } from '@/shared/auth/me'

// TODO: 향후 삭제 — 임시 쿠키 기반 라우트 가드 + 로그인 리다이렉트 전체를 실제 인증으로 교체

function isPublicPath(pathname: string): boolean {
  if (pathname === '/' || pathname === '/login-required') return true
  if (/\.(?:ico|png|jpg|jpeg|svg|gif|webp|txt|html|woff2?|ttf|eot|webmanifest)$/i.test(pathname)) {
    return true
  }
  return false
}

// TODO: 향후 삭제 — 기본 탭 리다이렉트는 라우팅 구조 확정 후 정리 (redirect 전용 page 복구 등)
/** /projects/:id 만 들어오면 기본 탭으로 보냄 (page.tsx에서 redirect만 쓰면 dev에서 performance.measure 오류 남) */
function redirectProjectRootToDefaultTab(request: NextRequest, pathname: string) {
  const m = pathname.match(/^\/projects\/([^/]+)$/)
  if (!m) return null
  if (m[1] === 'recommendations') return null
  const url = request.nextUrl.clone()
  url.pathname = `${pathname}/research-analysis`
  return NextResponse.redirect(url)
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/_next')) {
    return NextResponse.next()
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const me = getDevAuthMe(request)
  if (!me.isLoggedIn) {
    const url = request.nextUrl.clone()
    url.pathname = '/login-required'
    return NextResponse.redirect(url)
  }

  const tabRedirect = redirectProjectRootToDefaultTab(request, pathname)
  if (tabRedirect) return tabRedirect

  return NextResponse.next()
}

// TODO: 향후 삭제 — 임시 인증과 함께 matcher·공개 경로 목록 재검토
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
