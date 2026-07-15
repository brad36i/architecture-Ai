import { API_BASE } from '@/shared/config/api';
import type { RndNoticeCardData } from '@/widgets/rnd-notice-card/model/types';

import type {
  BaseRecommendationResponse,
  RecommendationNoticeApiItem,
  UserRecommendationDataV2,
} from './api-types';

export function mapRecommendationItemToCard(
  item: RecommendationNoticeApiItem
): RndNoticeCardData {
  const orgParts = [item.ministryName, item.orderAgencyName].filter((s) => s?.trim());
  const org = orgParts.join(' ');
  const organizationLine =
    org && item.announcementNum?.trim()
      ? `${org} · ${item.announcementNum.trim()}`
      : org || item.announcementNum?.trim() || undefined;

  const qualification =
    [item.isInitiation, item.managerContact].find((s) => s?.trim()) ?? undefined;

  return {
    id: item.id || item.noticeId,
    noticeId: item.noticeId || item.id,
    title: item.title,
    status: item.status ?? '',
    organizationLine,
    announcementNum: item.announcementNum ?? undefined,
    startDateTime: item.startDate ?? undefined,
    endDateTime: item.endDate ?? undefined,
    fund: item.fund ?? undefined,
    publishedAt: item.publishedAt ?? undefined,
    offeringType: item.noticeType ?? undefined,
    qualificationNotice: qualification,
    /** 카드 마감 문구 계산용 — 타입상 `dDay`이지만 실제로는 마감 시각(일) 기준 */
    dDay: item.endDate ?? undefined,
  };
}

export async function fetchUserRecommendations(
  userId: number
): Promise<UserRecommendationDataV2> {
  const res = await fetch(`${API_BASE}/api/v2/users/${userId}/recommendation`);
  const json = (await res.json()) as BaseRecommendationResponse<UserRecommendationDataV2>;
  if (!res.ok || !json.success || !json.data) {
    throw new Error('추천 공고를 불러올 수 없습니다');
  }
  return json.data;
}
