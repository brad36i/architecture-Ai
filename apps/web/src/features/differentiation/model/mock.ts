/**
 * Mock 차별성 검토 데이터
 * 추후 연구계획서/선행연구 store 연동 시 AI 분석으로 교체
 */

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  score?: number;
  maxScore: number;
  memo: string;
}

export interface StrengthWeaknessItem {
  type: 'strength' | 'weakness';
  title: string;
  content: string;
}

export interface SuggestionItem {
  target: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

export const MOCK_CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: '1',
    label: '기술적 독창성',
    description: '선행기술 대비 차별적 기술 요소가 명확한가',
    checked: true,
    score: 8,
    maxScore: 10,
    memo: '',
  },
  {
    id: '2',
    label: '시장 차별화',
    description: '시장 Needs와 연계된 차별점이 제시되었는가',
    checked: true,
    score: 7,
    maxScore: 10,
    memo: '',
  },
  {
    id: '3',
    label: '정량적 근거',
    description: '목표치·지표가 구체적이고 검증 가능한가',
    checked: false,
    score: 5,
    maxScore: 10,
    memo: '목표치 보완 필요',
  },
  {
    id: '4',
    label: '객관적 입증 방법',
    description: '제3자 검증 가능한 방법(시험성적서 등) 제시',
    checked: false,
    maxScore: 10,
    memo: '',
  },
];

export const MOCK_STRENGTH_WEAKNESS: StrengthWeaknessItem[] = [
  {
    type: 'strength',
    title: 'AI 융합 접근',
    content: '기존 방식 대비 컴퓨터 비전 + 딥러닝 조합이 차별적',
  },
  {
    type: 'strength',
    title: '실시간 처리',
    content: '24시간 무인 감시·즉시 경보 체계로 활용성 높음',
  },
  {
    type: 'weakness',
    title: '목표치 근거 부족',
    content: 'PPE 15%p 향상 등 수치의 선행연구 근거 미흡',
  },
  {
    type: 'weakness',
    title: '검증 방법 모호',
    content: '제3자 시험성적서·실측 보고서 등 객관적 입증 방안 필요',
  },
];

export const MOCK_SUGGESTIONS: SuggestionItem[] = [
  {
    target: '목표치 근거 부족',
    suggestion:
      '선행연구 A(2022)의 12%p 개선 사례를 인용하고, 본 연구의 기술적 개선으로 15%p 달성 가능성을 정량적 근거와 함께 서술하세요.',
    priority: 'high',
  },
  {
    target: '검증 방법 모호',
    suggestion:
      '공인시험기관(KOLAS 등)의 PPE 착용률 측정 시험 프로토콜을 명시하고, 실험 전·후 비교 시험성적서 제출 계획을 추가하세요.',
    priority: 'high',
  },
  {
    target: '시장 차별화',
    suggestion:
      '건설 현장 안전관리 SW 시장 규모(연 500억원 등)를 인용하여 본 기술의 시장 진입 가능성을 구체화하세요.',
    priority: 'medium',
  },
];
