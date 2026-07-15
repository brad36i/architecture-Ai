import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/stores/auth-store';
import type { RndNoticeCardData } from '@/widgets/rnd-notice-card/model/types';

import { fetchUserRecommendations, mapRecommendationItemToCard } from './recommendation-api';

export const recommendationsQueryKey = (userId: number) =>
  ['recommendations', 'v2', userId] as const;

// TODO: 향후 삭제 — userId 없으면 쿼리 비활성은 임시 인증 전제
export function useRecommendations() {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: userId != null ? recommendationsQueryKey(userId) : (['recommendations', 'v2', 'pending'] as const),
    queryFn: async () => {
      if (userId == null) throw new Error('로그인이 필요합니다');
      const data = await fetchUserRecommendations(userId);
      const personalizedItems: RndNoticeCardData[] = (data.personalized ?? []).map(
        mapRecommendationItemToCard
      );
      const freeCompetitionItems: RndNoticeCardData[] = (data.freeCompetition ?? []).map(
        mapRecommendationItemToCard
      );

      return {
        personalizedItems,
        freeCompetitionItems,
        generatedAt: data.generatedAt,
        message: data.message,
      };
    },
    enabled: userId != null,
  });
}
