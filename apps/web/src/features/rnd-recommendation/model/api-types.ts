/** GET /api/v2/users/{user_id}/recommendation — data.personalized/freeCompetition 항목 */
export interface RecommendationNoticeApiItem {
  id: string;
  noticeId: string;
  title: string;
  ministryName: string | null;
  orderAgencyName: string | null;
  announcementNum: string | null;
  publishedAt: string | null;
  status: string | null;
  noticeType: string | null;
  ancmPrg?: string | null;
  reNotice?: string | null;
  applicationDate?: string | null;
  startDate: string | null;
  endDate: string | null;
  budgetProject?: string | null;
  managerContact?: string | null;
  isInitiation?: string | null;
  dDay?: number | null;
  showing?: boolean | null;
  fund?: string | null;
  views?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  score?: number | null;
}

export interface UserRecommendationDataV2 {
  userId: number;
  generatedAt?: string;
  personalized: RecommendationNoticeApiItem[];
  freeCompetition: RecommendationNoticeApiItem[];
  message?: string;
}

export interface BaseRecommendationResponse<T> {
  success: boolean;
  statusCode: number;
  data: T | null;
}
