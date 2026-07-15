/**
 * Mock RB 평가 항목 데이터
 * research-analysis mock(공고 요약)과 연계하여 평가 항목 생성
 * 추후 공고 API 연동 시 동적 생성
 */

export interface EvaluationItem {
  id: string
  label: string
  maxScore: number
  description: string
  checklist: string[]
  selfScore?: number
  memo: string
}

export const MOCK_EVALUATION_ITEMS: EvaluationItem[] = [
  {
    id: "1",
    label: "기술적 창의성",
    maxScore: 30,
    description: "기술의 독창성, 혁신성, 차별성",
    checklist: [
      "선행기술 대비 차별적 요소가 명확한가",
      "기술적 난이도와 혁신성이 제시되었는가",
      "정량적 목표 및 검증 방법이 구체적인가",
    ],
    selfScore: 22,
    memo: "",
  },
  {
    id: "2",
    label: "연구수행능력",
    maxScore: 25,
    description: "연구팀 역량, 실적, 추진체계",
    checklist: [
      "연구팀 구성과 역할 분담이 적절한가",
      "관련 연구 실적이 충분한가",
      "추진체계 및 일정이 현실적인가",
    ],
    selfScore: 18,
    memo: "",
  },
  {
    id: "3",
    label: "기대효과",
    maxScore: 25,
    description: "경제·사회·기술적 기대효과",
    checklist: [
      "기대효과가 구체적이고 정량적인가",
      "사업화·기술이전 가능성이 제시되었는가",
      "사회적 파급효과가 설명되었는가",
    ],
    selfScore: 19,
    memo: "",
  },
  {
    id: "4",
    label: "추진계획 적정성",
    maxScore: 20,
    description: "예산, 일정, 위험관리",
    checklist: [
      "예산 편성이 합리적인가",
      "연차별 일정이 구체적인가",
      "위험요인 및 대응방안이 있는가",
    ],
    selfScore: 14,
    memo: "일정표 보완 필요",
  },
]
