import type { ProjectElaborationDetail } from '@/entities/project';

/** API v2 /api/v2/users/{user_id}/projects 응답 스키마 */
export interface ProjectListDataV2 {
  projects: ProjectListItemV2[];
}

/** API v2 GET /api/v2/projects/{project_id}/me 응답 data (OpenAPI ProjectMeResponse) */
export interface ProjectMeResponse {
  id: string;
  noticeId?: string | null;
  url?: string | null;
  llmTitle?: string | null;
  keywords?: string[];
  elaborationScore?: number;
  userId?: number;
  currentStep?: string | number;
  ministryNames?: string[];
  budgetProject?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  fundings?: string | null;
  programBudget?: string | null;
  noticeTypes?: string[];
  isPinned?: boolean;
  elaborationDetail?: ProjectElaborationDetail | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ProjectListItemV2 {
  id: string;
  noticeId?: string | null;
  noticeTitle?: string | null;
  url?: string | null;
  llmTitle?: string | null;
  keywords?: string[];
  isPinned?: boolean;
  budgetProject?: string | null;
  programBudget?: string | null;
  fundings?: string | null;
  ministryNames?: string[];
  noticeTypes?: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface BaseResponse<T> {
  success: boolean;
  statusCode: number;
  data: T | null;
}

/** PATCH /api/v2/projects/{project_id}/pin 요청 본문 */
export interface ProjectPinRequest {
  isPinned: boolean;
}

/** PATCH /api/v2/projects/{project_id}/pin 응답 data */
export interface ProjectPinResponse {
  projectId: string;
  isPinned: boolean;
}

/** PATCH /api/v2/projects/{project_id} 요청 본문 */
export interface ProjectPatchRequestV2 {
  llmTitle?: string | null;
  url?: string | null;
  keywords?: string[] | null;
  ministryNames?: string[] | null;
  noticeTypes?: string[] | null;
  startDate?: string | null;
  endDate?: string | null;
  budgetProject?: string | null;
  fundings?: string | null;
  programBudget?: string | null;
}

/** POST /api/v2/workflows/{user_id}/projects/init-detail 요청 본문 (noticeId 필수) */
export interface ProjectInitDetailRequest {
  noticeId: string;
  noticeTitle?: string;
  programNames?: string[];
  ministryNames?: string[];
  fundings?: string[];
  startDate?: string;
  endDate?: string;
  noticeTypes?: string[];
  url?: string;
}

/** POST /api/v2/workflows/{user_id}/projects/init-detail 응답 data */
export interface ProjectInitCreateResponseV2 {
  userId: number | string;
  projectId: string;
  stepNum: number;
  step: string;
  message: string;
}
