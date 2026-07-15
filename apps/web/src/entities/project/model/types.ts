export type CompetitionType = '자유공모' | '지정공모';

/** GET /api/v2/projects/{id}/me — elaborationDetail.subScores 항목 */
export type ProjectElaborationSubScore = {
  category: string;
  score: number;
  maxScore?: number;
  feedback?: string;
};

/** GET /api/v2/projects/{id}/me — elaborationDetail */
export type ProjectElaborationDetail = {
  subScores?: ProjectElaborationSubScore[];
  evaluatedAt: string;
  currentStep?: number;
};

export type ProjectCard = {
  id: string;
  topic: string;
  supportProjectName: string;
  organizingInstitution: string;
  totalBudget: string;
  applicationPeriod: string;
  competitionType: CompetitionType;
  editedAt: string;
  starred: boolean;
  /** 아이리스 링크 (한국연구재단 IRIS 시스템) */
  irisUrl?: string;
  /** 이지알앤디 공고 ID */
  ezrndNoticeId?: string;
  /** 연구 키워드 */
  keywords?: string[];
  /** 지원서 시작일 (API startDate) */
  startDate?: string;
  /** 지원서 종료일 (API endDate) */
  endDate?: string;
  /** /me 전용: 사용자 ID */
  userId?: number;
  /** /me 전용: 현재 단계 */
  currentStep?: string | number;
  /** /me 전용: 연구 구체화 점수 */
  elaborationScore?: number;
  /** /me 전용: 구체화 점수 상세 */
  elaborationDetail?: ProjectElaborationDetail | null;
  /** /me 전용: 생성 일시 */
  createdAt?: string | null;
  /** 클라이언트 전용: init-detail API 응답 대기 중(낙관적 카드) */
  isPendingInit?: boolean;
};
