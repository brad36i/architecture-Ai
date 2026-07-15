export type NoticeOverview = {
  background: string;
  objective: string;
  content: string;
};

export type SubProgram = {
  id: string;
  title: string;
  program_name: string | null;
  keywords: string[];
  period: string;
  budget: string | null;
  funding: string;
  funding_detail: string;
  funding_rate: string;
  trl_level: string | null;
  summary: string | null;
  overview: NoticeOverview | null;
};

/** OpenAPI `NoticeEvaluationItem` */
export type NoticeEvaluationRow = {
  item: string;
  metric: string;
  score_max: number;
};

/** OpenAPI `NoticeAnalysisSubmissionChecklistItem` */
export type NoticeSubmissionChecklistItem = {
  id: string;
  type: string;
  content: string;
  group_path: string[];
  required: boolean;
  source: string;
  description: string;
};

export type Notice = {
  notice_id: string;
  notice_display_id: string;
  notice_name: string;
  title: string;
  ministry_names: string[];
  order_agency_name: string;
  notice_types: string[];
  status: string;
  program_names: string;
  /** OpenAPI `keywords` — 추출 키워드 */
  keywords: string[];
  available_orgs: string[];

  program_budget: string;
  fundings: string;
  funding_detail: string;
  funding_rate: string;
  period: string;

  consortium_requirement: string | null;
  consortium_structure: string | null;

  summary: string;
  overview: NoticeOverview;
  trl_level: string | null;

  common_requirements: string;
  investigator_requirements: string;
  research_lab_requirements: string | null;
  location_requirements: string | null;
  concurrent_project_limit: string;

  additional_requirements: string | null;

  sub_programs: SubProgram[] | null;

  /** OpenAPI `evaluation` */
  evaluation: NoticeEvaluationRow[];
  /** OpenAPI `submissionChecklistTemplate` */
  submission_checklist_template: NoticeSubmissionChecklistItem[];
};

export const MOCK_NOTICE: Notice = {
  notice_id: 'notice-001',
  notice_display_id: '보건복지부공고 제2025-961호',
  notice_name: '2026년도 제1차 보건의료기술 연구개발사업 신규지원 대상과제 통합공고',
  title: '2026년도 제1차 보건의료기술 연구개발사업 신규지원 대상과제 통합공고',
  ministry_names: ['보건복지부', '질병관리청'],
  order_agency_name: '한국보건산업진흥원',
  notice_types: ['자유공모', '지정공모'],
  status: '공고중',
  program_names: '보건의료기술 연구개발사업',
  keywords: ['디지털헬스', '정밀의료', '임상연구'],
  available_orgs: ['대학', '국공립/민간연구기관', '중견기업'],

  program_budget: '약 1,200억원',
  fundings: '과제당 최대 5억원/년',
  funding_detail: '- 직접비 + 간접비 포함\n- 인건비: 직접비의 50% 이내\n- 연구재료비: 제한 없음',
  funding_rate: '정부출연금 70%, 기관부담금 30%',
  period: '최대 3년 (2026.04 ~ 2029.03)',

  consortium_requirement: '주관기관 1개 + 공동연구기관 최대 4개',
  consortium_structure:
    '- 주관기관: 연구책임자 소속 기관\n- 공동연구기관: 세부과제 수행 기관\n- 위탁연구기관: 별도 계약 가능',

  summary:
    '보건복지부는 국민 건강증진 및 의료기술 고도화를 목표로 2026년도 보건의료기술 건축 공고를 공모합니다. 본 사업은 기초·임상·산업화 전주기 건축을 지원하며, 디지털헬스, 정밀의료, 재생의료 등 첨단 분야를 중점 지원합니다.\n\n주요 지원 분야:\n- 디지털헬스케어 기술 개발\n- 정밀의료 플랫폼 구축\n- 신약·의료기기 개발 촉진\n- 감염병 대응 기술 강화',
  overview: {
    background:
      '글로벌 헬스케어 시장 급성장과 함께 국내 보건의료 건축 투자 확대 필요성 대두. 특히 COVID-19 이후 감염병 대응 역량과 디지털 전환이 핵심 과제로 부상함.',
    objective:
      '- 보건의료기술 혁신을 통한 국민 건강수명 연장\n- 글로벌 경쟁력 있는 보건의료 건축 성과 창출\n- 산·학·연 협력 생태계 강화',
    content:
      '1. 기초연구: 원천기술 발굴 및 질환 메커니즘 규명\n2. 임상연구: 치료법 유효성·안전성 검증\n3. 산업화 연구: 제품화·사업화 연계 연구\n4. 디지털헬스: AI 진단, 원격의료, 웨어러블 기술',
  },
  trl_level: null,

  common_requirements:
    '- 국가연구개발사업 참여 제한 제재를 받지 않은 자\n- 사업비 부정 사용 이력 없는 기관\n- 기관 IRB 승인 가능한 기관 (임상건축 해당 시)',
  investigator_requirements:
    '- 박사학위 소지자 또는 동등 이상의 건축 경력 보유\n- 책임연구원 지정: 최소 20% FTE 이상\n- 동일 연구기간 내 타 과제 책임연구원 겸직 제한 (3책5공 적용)',
  research_lab_requirements: null,
  location_requirements: '국내 소재 기관에 한함',
  concurrent_project_limit:
    '3책5공 규정 적용: 책임연구원 최대 3개 과제, 공동연구원 최대 5개 과제 동시 수행 가능',

  additional_requirements:
    '- 보안등급 해당 과제는 별도 보안서약서 제출\n- 생명윤리 관련 과제는 IRB 승인서 제출 필수\n- 임상시험 포함 과제는 식약처 허가 일정 포함',

  evaluation: [
    {
      item: '기술적 독창성',
      metric: '선행기술 대비 차별적 기술 요소가 명확한가',
      score_max: 10,
    },
  ],
  submission_checklist_template: [
    {
      id: 'mock-1',
      type: 'notice',
      content: '공고문 상 신청 서류 예시',
      group_path: ['제출 서류'],
      required: true,
      source: 'notice',
      description: '',
    },
  ],

  sub_programs: [
    {
      id: 'sub-001',
      title: '디지털헬스케어 원천기술 개발',
      program_name: null,
      keywords: ['디지털헬스', 'AI 진단', '웨어러블', '원격의료'],
      period: '3년',
      budget: null,
      funding: '최대 3억원/년',
      funding_detail:
        '- 소프트웨어 개발비 포함\n- 임상데이터 수집 비용 지원\n- 기기 제작비 별도 산정 가능',
      funding_rate: '정부 70% / 기관 30%',
      trl_level: '3~6단계',
      summary: 'AI 기반 진단 보조 소프트웨어 및 웨어러블 의료기기 원천기술 개발을 지원합니다.',
      overview: null,
    },
    {
      id: 'sub-002',
      title: '감염병 대응 백신·치료제 개발',
      program_name: null,
      keywords: ['감염병', '백신', '치료제', 'mRNA'],
      period: '4년',
      budget: null,
      funding: '최대 5억원/년',
      funding_detail:
        '- 임상시험 비용 포함\n- GMP 시설 사용료 지원\n- 해외 공동사업비 별도 가산 가능',
      funding_rate: '정부 80% / 기관 20%',
      trl_level: '2~5단계',
      summary: '신·변종 감염병 대응을 위한 플랫폼 백신 및 광범위 치료제 개발 과제를 지원합니다.',
      overview: {
        background: '팬데믹 경험을 바탕으로 신속 대응 가능한 백신 플랫폼 기술 확보 필요',
        objective:
          '- mRNA 백신 국산화 기반 구축\n- 범용 항바이러스제 후보물질 발굴\n- 신속 임상 전환 체계 마련',
        content:
          '1. 플랫폼 기술 개발 (mRNA, 바이러스벡터 등)\n2. 임상 1/2상 수행\n3. 비임상 독성·약효 평가\n4. CMC 개발 및 GMP 생산',
      },
    },
  ],
};
