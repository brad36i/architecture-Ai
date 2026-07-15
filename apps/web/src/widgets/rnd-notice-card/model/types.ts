/** 건축 공고 카드 데이터 형태 */
export type RndNoticeCategory = {
  categoryCode: number;
  categoryName: string;
  score: number;
};

export type RndNoticeCardData = {
  id: string;
  /** 이지알앤디 공고 상세 URL 등에 사용 */
  noticeId?: string;
  title: string;
  status: string;
  ministry?: { title?: string };
  orderAgency?: { title?: string };
  /** 스크린샷처럼 기관·공고번호 한 줄 전체 (없으면 ministry/orderAgency/announcementNum으로 조합) */
  organizationLine?: string;
  /** 미지정 시 `/gov.png` */
  logo?: string;
  announcementNum?: string;
  /** 접수 마감일 — `deadlineDisplay` 없을 때 상대 마감 문구 계산에 사용 */
  dDay?: string;
  /** API/목업에서 마감 문구를 직접 줄 때 (예: 마감 1주 1일 전) */
  deadlineDisplay?: string;
  startDateTime?: string;
  endDateTime?: string;
  fund?: string;
  publishedAt?: string;
  noticeType?: string[];
  offeringType?: string;
  categories?: RndNoticeCategory[];
  redirectUrl?: { irisUrl?: string; applyUrl?: string };
  /** 상단 자격/공지 한 줄 */
  qualificationNotice?: string;
};
