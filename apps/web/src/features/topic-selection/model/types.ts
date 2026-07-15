import type { Edge } from '@xyflow/react';

// ============================================================================
// 도메인 타입
// ============================================================================

export type TopicContent = {
  subject: string;
  necessity: string;
  methodology: string;
  expectedEffect: string;
  keywords: string[];
  /** 백엔드 overview — 카드 본문 미리보기 */
  overview?: string;
  /** 백엔드 content 원문 — 상세 패널 「상세보기」 탭 */
  fullContent?: string;
  /** 백엔드 detail — 상세 패널 「AI 추론」 탭 */
  detail?: string;
};

/** 연구계획초안 생성(건축 주제 선정) 시 마지막 노드에 항상 표시되는 구조 (README 기준) */
export type SelectedTopicContent = {
  finalObjective: string; // 최종목표내용 800자 이내
  researchContent: string; // 건축 기획내용 800자
  expectedEffectAndPlan?: string; // 건축 성과 활용계획 및 기대효과 600자 이내
};

export const SELECTED_TOPIC_LIMITS = {
  finalObjective: 800,
  researchContent: 800,
  expectedEffectAndPlan: 600,
} as const;

/** 건축 주제선정 완료 노드의 서버 depth 고정값 */
export const TOPIC_API_DEPTH_FINAL_SENTINEL_MIN = 10;

export function isTopicApiDepthFinalSentinel(depth: number | undefined | null): boolean {
  return typeof depth === 'number' && depth === TOPIC_API_DEPTH_FINAL_SENTINEL_MIN;
}

// ============================================================================
// 레이아웃 상수
// ============================================================================

export const NODE_OFFSET_X = 400;
export const NODE_OFFSET_Y = 280;
export const INPUT_NODE_X = 140;
export const INPUT_NODE_Y = 280;

// ============================================================================
// 엣지 기본 옵션
// ============================================================================

export const defaultEdgeOptions: Partial<Edge> = {
  type: 'default',
  sourceHandle: 'right-source',
  targetHandle: 'left-target',
  style: { stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '5,5' },
  markerEnd: { type: 'arrowclosed', color: '#94a3b8' },
};

export const solidEdgeOptions: Partial<Edge> = {
  type: 'default',
  sourceHandle: 'right-source',
  targetHandle: 'left-target',
  style: { stroke: '#64748b', strokeWidth: 2 },
  markerEnd: { type: 'arrowclosed', color: '#64748b' },
};

// ============================================================================
// Mock 데이터 & 생성 함수
// ============================================================================

export const MOCK_TOPIC_CONTENTS: TopicContent[] = [
  {
    subject: '대형 건설 현장 컴퓨터 비전 기반 PPE 실시간 감시·경보 시스템 도입 효과',
    necessity:
      '건설업은 산업재해율이 높고, PPE 미착용이 주요 원인으로 지목된다. 기존 현장 감시는 인력 한계로 실시간 대응이 어렵다. 컴퓨터 비전 기반 자동 감시 시스템은 24시간 무인 모니터링과 즉시 경보를 통해 PPE 준수율 향상과 재해 예방을 기대할 수 있다.',
    methodology:
      '대형 일반건축 현장(연면적 10만㎡ 이상) 2곳을 선정하여 실험군과 대조군을 설정한다. 실험군에는 YOLOv8 기반 PPE 객체 탐지 모델을 개발하고, 현장 CCTV와 연동한 실시간 감시·경보 시스템을 구축한다. 9-12개월간 작업자 PPE 착용률, 근접사고 발생률, 안전기후 설문을 수집하여 전후 비교 분석한다. 대조군은 기존 방식 유지로 동일 기간 데이터를 수집한다.',
    expectedEffect:
      '실험군에서 PPE 준수율 15%p 이상 상승, PPE 관련 근접사고 20% 이상 감소, 작업반 수준 안전기후 점수(관리 지원·의사소통) 유의한 향상을 기대한다.',
    keywords: ['컴퓨터비전', 'PPE', '건설안전', '실시간감시', '객체탐지'],
  },
  {
    subject: '드론 LiDAR와 BIM 융합 건축물 시공 품질 자동 검사 시스템 개발',
    necessity:
      '건축물 시공 품질 검사는 주로 육안과 샘플링 방식으로 이루어져 시간과 비용이 많이 소요된다. LiDAR 스캔과 BIM 모델 비교를 통한 자동 검사는 전수 검사와 객관적 판정을 가능하게 한다. 시공 단계별 품질 이슈 조기 발견으로 유지보수 비용 절감과 공정 기간 단축이 기대된다.',
    methodology:
      '건축물 BIM 모델과 LiDAR 스캔 포인트 클라우드를 정합하여 偏差를 산출하는 알고리즘을 개발한다. 드론 탑재 LiDAR로 현장 스캔 데이터를 수집하고, ICP/NDT 기반 정합 후 허용 오차를 초과하는 영역을 자동 탐지한다. 3개 이상 실제 시공 현장에서 검증 실험을 수행하고, 기존 육안 검사 대비 시간·비용 절감 효과를 정량 평가한다.',
    expectedEffect:
      '품질 검사 시간 50% 이상 단축, 품질 이슈 탐지율 향상, 시공 품질 데이터의 디지털 아카이빙으로 유지보수 단계 활용 가능.',
    keywords: ['LiDAR', 'BIM', '시공품질', '드론', '포인트클라우드'],
  },
  {
    subject: '강화학습 기반 건설장비 자율운전 및 협업 시뮬레이션 플랫폼',
    necessity:
      '건설 장비 운전사의 부족과 고령화가 심화되고, 협업 장비 간 충돌·근접사고 위험이 존재한다. 자율운전 기술과 시뮬레이션 기반 훈련은 인력 수요 완화와 안전성 향상에 기여할 수 있다. 실제 현장 전에 가상 환경에서 시나리오 검증이 가능하다.',
    methodology:
      'Unity/Unreal 기반 3D 건설 현장 시뮬레이션 환경을 구축하고, PPO/SAC 강화학습으로 장비 자율운전 정책을 학습한다. 다중 에이전트 환경에서 지게차·굴삭기·덤프트럭의 협업 시나리오(적재·운반·하역)를 설계하여 충돌 회피·작업 효율을 최적화한다. 실제 장비 제어기와 HIL(하드웨어 인 더 루프) 연동으로 이식 가능성을 검증한다.',
    expectedEffect:
      '가상 현장에서 자율주행 정책 사전 검증, 실험 비용·위험 감소, 시뮬레이터 기반 운전사 훈련 플랫폼으로 확장 가능.',
    keywords: ['강화학습', '자율운전', '건설장비', '시뮬레이션', '다중에이전트'],
  },
];

// ============================================================================
// 로딩 메시지 (prompt_node 전용)
// 나중에 SSE/폴링으로 서버에서 받을 구조와 동일하게 맞춰둠
// ============================================================================

export type LoadingStep = {
  /** 상위 1줄: 현재 단계 요약 */
  stepLabel: string;
  /** 하위 세부 메시지 목록 – 순서대로 하나씩 표시 */
  details: string[];
};

/** prompt_node 로딩 시 사용하는 2단계 메시지 시퀀스 */
export const PROMPT_NODE_LOADING_STEPS: LoadingStep[] = [
  {
    stepLabel: '입력한 건축 아이디어를 분석해 주제 후보를 설계합니다',
    details: [
      '입력한 건축 아이디어의 핵심 문제를 추출합니다.',
      '건축 목적과 적용 범위를 구조화합니다.',
      '기존 접근 방식과 차별 포인트를 정리합니다.',
      '하나의 아이디어를 여러 건축 방향으로 분해합니다.',
      '중복 가능성이 높은 개념을 분리 정리합니다.',
      '건축 관점별 확장 가능 영역을 탐색합니다.',
    ],
  },
  {
    stepLabel: '서로 겹치지 않는 건축 주제 3개를 확정합니다',
    details: [
      '건축 방향이 겹치지 않도록 주제를 분리합니다.',
      '각 주제의 핵심 질문을 1문장으로 정리합니다.',
      '건축 범위가 충돌하지 않도록 경계를 조정합니다.',
      '주제별 차별성 기준을 점검합니다.',
      '실행 가능성을 기준으로 후보를 정제합니다.',
      '후속 에이전트로 전달할 주제 형태로 정리합니다.',
    ],
  },
];

/** topic_node 로딩 시 사용하는 2단계 메시지 시퀀스
 *
 * prompt_node(PROMPT_NODE_LOADING_STEPS)와 달리 topic_node는 3개가 병렬로 실행됨.
 * 각 노드가 같은 단계를 돌기 때문에 stepLabel은 고정, detail은 일정 간격으로 순환.
 *
 * TODO: SSE 연결 시 서버에서 { stepLabel, detail } 을 직접 내려주면
 *       이 상수 대신 서버 값을 그대로 바인딩하면 됨.
 */
export const TOPIC_NODE_LOADING_STEPS: LoadingStep[] = [
  {
    stepLabel: '아이디어를 건축 관점으로 확장합니다',
    details: [
      '입력한 아이디어의 핵심 개념을 정리합니다.',
      '건축 문제로 해석 가능한 요소를 추출합니다.',
      '다양한 건축 접근 관점을 탐색합니다.',
      '적용 가능한 건축 영역을 확장합니다.',
    ],
  },
  {
    stepLabel: '주제 분리를 위한 구조를 정리합니다',
    details: [
      '건축 방향이 겹치지 않도록 구분합니다.',
      '서로 다른 건축 축을 정의합니다.',
      '독립적인 주제 후보 구조를 생성합니다.',
      '다음 단계에서 생성할 주제를 정리합니다.',
    ],
  },
];

export const generateTopics = (prompt: string): string[] => [
  `주제 1: ${prompt}에 대한 첫 번째 건축 가설`,
  `주제 2: ${prompt}에 대한 두 번째 건축 가설`,
  `주제 3: ${prompt}에 대한 세 번째 건축 가설`,
];

export const generateHypothesis = async (
  prompt: string
): Promise<{ content: TopicContent; label: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const base = '대형 일반건축 현장에서 컴퓨터 비전 기반 실시간 PPE 감시·경보 시스템을 도입하면';
  return {
    label: `${base}, 유사 특성의 미도입 현장 대비 9-12개월 내 PPE 준수율이 유의하게 상승하고(≥15%p), PPE 관련 근접사고 및 관련 사고 발생률이 유의하게 감소(≥20%)하며, 작업반 수준 안전기후 점수가 유의하게 향상된다.`,
    content: {
      subject: `건축 주제입니다. ${prompt} 건축과 머시기로 융합한 초현실.`,
      necessity:
        '연구필요성이다. 한줄이면 될것같다. 산업재해 예방과 작업자 안전 향상을 위해 실시간 PPE 감시 시스템의 도입 필요성이 대두된다.',
      methodology:
        '그담 연구연구방법론이다. 방법론이다. 대형 건설 현장에서 실험군과 대조군을 설정하여 9-12개월간 추적 관찰 건축을 진행한다. 컴퓨터 비전 기반 객체 탐지 모델을 개발하고, 현장 카메라와 연동하여 실시간 PPE 착용 여부를 판별하는 알고리즘을 구축한다.',
      expectedEffect:
        '그리고 마지막으로 기대효과이다. PPE 준수율 15%p 이상 향상, PPE 관련 사고 발생률 20% 이상 감소, 작업반 수준 안전기후 점수 향상.',
      keywords: ['키워드1', '키워드2', '키워드3', '키워드4', '키워드5'],
    },
  };
};

/** 건축 주제선정: 내용을 정리·보강한 요약. 항상 README 기준 3개 필드 구조로 반환 */
export const summarizeTopicForSelection = async (
  prompt: string,
  content?: TopicContent
): Promise<{ subject: string; body: SelectedTopicContent }> => {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const baseSubject = content?.subject ?? prompt;
  const subject = `[선정] ${baseSubject.slice(0, 40)}${baseSubject.length > 40 ? '…' : ''}`;

  const body: SelectedTopicContent = content
    ? {
        finalObjective: content.necessity || content.subject,
        researchContent: content.methodology,
        expectedEffectAndPlan: content.expectedEffect,
      }
    : {
        finalObjective: prompt,
        researchContent:
          '위 주제를 체계적으로 수행하기 위한 방법론을 설계하고, 실험군·대조군 설정으로 검증 계획을 수립한다.',
        expectedEffectAndPlan:
          '목표 지표 달성 시 산업 전반의 안전 수준 향상과 재해 예방에 기여할 수 있다.',
      };

  return { subject, body };
};

export const refineTopic = (_topicId: string, prompt: string): string[] => {
  const count = Math.random() > 0.5 ? 1 : 2;
  return Array.from(
    { length: count },
    (_, i) => `보완된 주제 ${i + 1}: ${prompt}에 대한 구체화된 건축 가설`
  );
};

export const mergeTopicContents = (
  nodes: { data: Record<string, unknown>; position: { x: number; y: number } }[],
  getContent: (n: { data: Record<string, unknown> }) => TopicContent | undefined,
  getLabel: (n: { data: Record<string, unknown> }) => string
): TopicContent => {
  const contents = nodes.map((n) => getContent(n)).filter((c): c is TopicContent => !!c);
  const labels = nodes.map((n) => getLabel(n)).filter(Boolean);

  if (contents.length === 0) {
    return {
      subject: labels.length > 0 ? `${labels.join(' + ')} 융합` : '융합 연구',
      necessity: labels.join('\n\n'),
      methodology: '',
      expectedEffect: '',
      keywords: [],
    };
  }

  return {
    subject:
      contents.length > 1
        ? `${contents.map((c) => c.subject).join(' + ')} 융합`
        : contents[0].subject + ' 융합',
    necessity: contents
      .map((c) => c.necessity)
      .filter(Boolean)
      .join('\n\n'),
    methodology: contents
      .map((c) => c.methodology)
      .filter(Boolean)
      .join('\n\n'),
    expectedEffect: contents
      .map((c) => c.expectedEffect)
      .filter(Boolean)
      .join('\n\n'),
    keywords: [...new Set(contents.flatMap((c) => c.keywords))].slice(0, 8),
  };
};
