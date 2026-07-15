'use client';

// TODO: 향후 삭제 — 임시 rehydrate·쿠키 prune 컴포넌트 전부 (실제 세션 전략에 맞게 제거)
import { useEffect } from 'react';

import { syncDevAuthSessionCookie } from '@/shared/lib/dev-auth-session-cookie';
import { useAuthStore } from '@/shared/stores/auth-store';

export function DevAuthSessionCookiePrune() {
  useEffect(() => {
    const pruneIfLoggedOut = () => {
      if (useAuthStore.getState().userId == null) {
        syncDevAuthSessionCookie(null);
      }
    };
    const unsub = useAuthStore.persist.onFinishHydration(pruneIfLoggedOut);
    void useAuthStore.persist.rehydrate();
    return unsub;
  }, []);

  return null;
}
