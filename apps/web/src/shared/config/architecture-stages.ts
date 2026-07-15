export type ArchitectureStageRoute =
  | 'research-analysis'
  | 'tech-standard'
  | 'topic-selection'
  | 'diagram-table'
  | 'differentiation'
  | 'research-plan'
  | 'rb-evaluation'
  | 'submission-checklist';

export type ArchitectureStage = {
  step: string;
  title: string;
  emoji: string;
  route: ArchitectureStageRoute;
};

export const ARCHITECTURE_STAGES: ArchitectureStage[] = [
  {
    step: '01',
    title: '공모 지침 분석',
    emoji: '📋',
    route: 'research-analysis',
  },
  {
    step: '02',
    title: '대지·법규·지침 검토',
    emoji: '📐',
    route: 'tech-standard',
  },
  {
    step: '03',
    title: '기능 관계 분석',
    emoji: '🔗',
    route: 'topic-selection',
  },
  {
    step: '04',
    title: '키워드 도출',
    emoji: '🔑',
    route: 'topic-selection',
  },
  {
    step: '05',
    title: '콘셉트 설정',
    emoji: '💡',
    route: 'topic-selection',
  },
  {
    step: '06',
    title: '배치대안 계획',
    emoji: '🧭',
    route: 'diagram-table',
  },
  {
    step: '07',
    title: '매스 계획',
    emoji: '🏢',
    route: 'research-plan',
  },
  {
    step: '08',
    title: '조닝 계획',
    emoji: '🧩',
    route: 'diagram-table',
  },
  {
    step: '09',
    title: '평면 계획',
    emoji: '📏',
    route: 'research-plan',
  },
  {
    step: '10',
    title: '외부공간 계획',
    emoji: '🌳',
    route: 'diagram-table',
  },
  {
    step: '11',
    title: '대안 비교 및 선정',
    emoji: '⚖️',
    route: 'differentiation',
  },
  {
    step: '12',
    title: '설계안 검토 및 보완',
    emoji: '🔍',
    route: 'rb-evaluation',
  },
  {
    step: '13',
    title: '패널 구성',
    emoji: '🖼️',
    route: 'submission-checklist',
  },
];

export function getArchitectureStage(step: string | null): ArchitectureStage | null {
  if (!step) return null;
  return ARCHITECTURE_STAGES.find((stage) => stage.step === step) ?? null;
}
