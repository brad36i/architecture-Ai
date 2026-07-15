import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/stores/auth-store';

import {
  fetchUserProfileV2,
  fetchUserV2,
  mapV2UserToResearcher,
} from './user-v2-api';

export type { UserV2Data } from './user-v2-api';

export const userV2QueryKey = (userId: number) => ['users', 'v2', userId] as const;

// TODO: 향후 삭제 — userId 없으면 쿼리 비활성은 임시 인증 전제
export function useUserAccount() {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: userId != null ? userV2QueryKey(userId) : (['users', 'v2', 'pending'] as const),
    queryFn: () => {
      if (userId == null) throw new Error('로그인이 필요합니다');
      return fetchUserV2(userId);
    },
    enabled: userId != null,
  });
}

// TODO: 향후 삭제 — 임시 인증(userId) 가드
export function useResearcher() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: ['researcher', 'v2', userId ?? 'pending'],
    queryFn: async () => {
      if (userId == null) throw new Error('로그인이 필요합니다');
      const user = await queryClient.ensureQueryData({
        queryKey: userV2QueryKey(userId),
        queryFn: () => fetchUserV2(userId),
      });
      const profile = await fetchUserProfileV2(userId);
      return mapV2UserToResearcher(user, profile);
    },
    enabled: userId != null,
  });
}
