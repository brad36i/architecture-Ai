export type TechStandardSystemType =
  | "국가과학기술표준분류"
  | "산업기술분류(2024년도)"
  | "중소기업_전략기술로드맵"
  | "6T관련기술코드"
  | "국가과가학기술표준분류"
  | "국가전략기술분류"

export interface TechStandardKeyword {
  id: string
  name: string
  percentage: number
}

export interface TechStandardCategoryPayload {
  type: TechStandardSystemType
  keywords: TechStandardKeyword[]
}

export interface TechStandardResponse {
  project_id: string
  categories: TechStandardCategoryPayload[]
}

export interface TechStandardSmallClass {
  id: string
  name: string
}

export interface TechStandardMediumClass {
  id: string
  name: string
  small: TechStandardSmallClass[]
}

export interface TechStandardLargeClass {
  id: string
  name: string
  medium: TechStandardMediumClass[]
}

export interface TechStandardSystemDefinition {
  type: TechStandardSystemType
  shortLabel: string
  description: string
  accentClassName: string
  large: TechStandardLargeClass[]
}

export interface TechStandardSelectionSlot {
  slot: 1 | 2 | 3
  largeId: string
  mediumId: string
  smallId: string
  percentage: number
}

export interface TechStandardSelectionPath {
  large: TechStandardLargeClass
  medium: TechStandardMediumClass
  small: TechStandardSmallClass
}

export const MOCK_TECH_STANDARD_SYSTEMS: TechStandardSystemDefinition[] = [
  {
    type: "국가과학기술표준분류",
    shortLabel: "NESTI",
    description: "국가 건축 공고 기준으로 많이 쓰는 표준 체계입니다.",
    accentClassName: "from-sky-500/20 via-sky-500/5 to-transparent",
    large: [
      {
        id: "nesti-digital",
        name: "정보/통신",
        medium: [
          {
            id: "nesti-ai",
            name: "인공지능",
            small: [
              { id: "nesti-ai-vision", name: "컴퓨터비전 응용" },
              { id: "nesti-ai-generative", name: "생성형 AI 서비스" },
              { id: "nesti-ai-agent", name: "지능형 에이전트" },
            ],
          },
          {
            id: "nesti-data",
            name: "데이터처리",
            small: [
              { id: "nesti-data-platform", name: "클라우드 데이터 플랫폼" },
              { id: "nesti-data-pipeline", name: "데이터 엔지니어링" },
              { id: "nesti-data-security", name: "프라이버시 보존 분석" },
            ],
          },
        ],
      },
      {
        id: "nesti-robotics",
        name: "기계/제조",
        medium: [
          {
            id: "nesti-mobility",
            name: "미래모빌리티",
            small: [
              { id: "nesti-mobility-autonomy", name: "자율주행 센서융합" },
              { id: "nesti-mobility-control", name: "전동화 제어" },
              { id: "nesti-mobility-sim", name: "디지털 시뮬레이션" },
            ],
          },
          {
            id: "nesti-smartfactory",
            name: "스마트제조",
            small: [
              { id: "nesti-smartfactory-robot", name: "협동로봇 제어" },
              { id: "nesti-smartfactory-inspection", name: "불량 예측 검사" },
              { id: "nesti-smartfactory-edge", name: "현장형 엣지 분석" },
            ],
          },
        ],
      },
    ],
  },
  {
    type: "산업기술분류(2024년도)",
    shortLabel: "산업기술",
    description: "사업화와 제조 현장 중심의 산업기술 분류 체계입니다.",
    accentClassName: "from-violet-500/20 via-violet-500/5 to-transparent",
    large: [
      {
        id: "industry-digital",
        name: "디지털산업",
        medium: [
          {
            id: "industry-software",
            name: "지능형SW",
            small: [
              { id: "industry-software-aiops", name: "AIops 운영자동화" },
              { id: "industry-software-twin", name: "산업용 디지털트윈" },
              { id: "industry-software-lowcode", name: "업무자동화 플랫폼" },
            ],
          },
          {
            id: "industry-device",
            name: "지능형디바이스",
            small: [
              { id: "industry-device-sensor", name: "고신뢰 센서모듈" },
              { id: "industry-device-camera", name: "산업용 영상장치" },
              { id: "industry-device-edge", name: "온디바이스 AI" },
            ],
          },
        ],
      },
      {
        id: "industry-bio",
        name: "바이오/헬스",
        medium: [
          {
            id: "industry-medical",
            name: "의료기기",
            small: [
              { id: "industry-medical-imaging", name: "영상진단 기기" },
              { id: "industry-medical-monitoring", name: "실시간 생체 모니터링" },
              { id: "industry-medical-robot", name: "재활로봇 시스템" },
            ],
          },
          {
            id: "industry-digital-health",
            name: "디지털헬스",
            small: [
              { id: "industry-digital-health-coach", name: "생활습관 코칭" },
              { id: "industry-digital-health-diagnosis", name: "AI 기반 판독지원" },
              { id: "industry-digital-health-data", name: "건강데이터 연계" },
            ],
          },
        ],
      },
    ],
  },
  {
    type: "중소기업_전략기술로드맵",
    shortLabel: "로드맵",
    description: "중소기업 관점에서 전략적으로 육성하는 기술 키워드입니다.",
    accentClassName: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    large: [
      {
        id: "sme-future-industry",
        name: "미래유망산업",
        medium: [
          {
            id: "sme-smart-city",
            name: "스마트시티",
            small: [
              { id: "sme-smart-city-safety", name: "도시안전 관제" },
              { id: "sme-smart-city-energy", name: "분산에너지 관리" },
              { id: "sme-smart-city-mobility", name: "도심형 이동서비스" },
            ],
          },
          {
            id: "sme-carbon-neutral",
            name: "탄소중립",
            small: [
              { id: "sme-carbon-neutral-measurement", name: "배출량 측정 자동화" },
              { id: "sme-carbon-neutral-reduction", name: "공정 최적화 절감" },
              { id: "sme-carbon-neutral-report", name: "환경성과 리포팅" },
            ],
          },
        ],
      },
      {
        id: "sme-digital",
        name: "디지털전환",
        medium: [
          {
            id: "sme-smart-factory",
            name: "스마트공장",
            small: [
              { id: "sme-smart-factory-qc", name: "비전 품질검사" },
              { id: "sme-smart-factory-scheduler", name: "생산 스케줄링" },
              { id: "sme-smart-factory-maintenance", name: "예지보전" },
            ],
          },
          {
            id: "sme-commerce",
            name: "지능형커머스",
            small: [
              { id: "sme-commerce-demand", name: "수요예측" },
              { id: "sme-commerce-recommendation", name: "개인화 추천" },
              { id: "sme-commerce-fulfillment", name: "물류 최적화" },
            ],
          },
        ],
      },
    ],
  },
  {
    type: "6T관련기술코드",
    shortLabel: "6T",
    description: "IT, BT, NT, ET, ST, CT 관점으로 묶은 기술 코드 체계입니다.",
    accentClassName: "from-amber-500/20 via-amber-500/5 to-transparent",
    large: [
      {
        id: "6t-it",
        name: "IT",
        medium: [
          {
            id: "6t-it-ai",
            name: "AI/데이터",
            small: [
              { id: "6t-it-ai-vision", name: "비전 인식" },
              { id: "6t-it-ai-language", name: "언어지능" },
              { id: "6t-it-ai-analytics", name: "지능형 분석" },
            ],
          },
          {
            id: "6t-it-network",
            name: "네트워크",
            small: [
              { id: "6t-it-network-edge", name: "에지 컴퓨팅" },
              { id: "6t-it-network-5g", name: "차세대 무선통신" },
              { id: "6t-it-network-security", name: "융합 보안" },
            ],
          },
        ],
      },
      {
        id: "6t-bt",
        name: "BT",
        medium: [
          {
            id: "6t-bt-diagnosis",
            name: "진단/치료",
            small: [
              { id: "6t-bt-diagnosis-imaging", name: "AI 영상진단" },
              { id: "6t-bt-diagnosis-companion", name: "동반진단" },
              { id: "6t-bt-diagnosis-monitoring", name: "원격 모니터링" },
            ],
          },
          {
            id: "6t-bt-bioinformatics",
            name: "바이오정보",
            small: [
              { id: "6t-bt-bioinformatics-omics", name: "오믹스 분석" },
              { id: "6t-bt-bioinformatics-discovery", name: "신약 후보 탐색" },
              { id: "6t-bt-bioinformatics-curation", name: "바이오 데이터 큐레이션" },
            ],
          },
        ],
      },
    ],
  },
  {
    type: "국가과가학기술표준분류",
    shortLabel: "확장분류",
    description: "전달 주신 명칭을 기준으로 추가 목업한 확장 분류 체계입니다.",
    accentClassName: "from-rose-500/20 via-rose-500/5 to-transparent",
    large: [
      {
        id: "extended-convergence",
        name: "융합기술",
        medium: [
          {
            id: "extended-human-ai",
            name: "인간중심AI",
            small: [
              { id: "extended-human-ai-assistive", name: "보조지능 인터페이스" },
              { id: "extended-human-ai-safety", name: "신뢰가능 AI" },
              { id: "extended-human-ai-collab", name: "협업형 AI 업무지원" },
            ],
          },
          {
            id: "extended-digital-content",
            name: "디지털콘텐츠",
            small: [
              { id: "extended-digital-content-3d", name: "실감형 3D 콘텐츠" },
              { id: "extended-digital-content-virtual", name: "가상훈련 시뮬레이터" },
              { id: "extended-digital-content-creative", name: "생성형 미디어 제작" },
            ],
          },
        ],
      },
      {
        id: "extended-social",
        name: "사회문제해결",
        medium: [
          {
            id: "extended-disaster",
            name: "재난대응",
            small: [
              { id: "extended-disaster-sensing", name: "이상징후 감지" },
              { id: "extended-disaster-command", name: "통합상황판" },
              { id: "extended-disaster-decision", name: "위기 의사결정 지원" },
            ],
          },
          {
            id: "extended-care",
            name: "돌봄기술",
            small: [
              { id: "extended-care-home", name: "재가돌봄 모니터링" },
              { id: "extended-care-robot", name: "돌봄보조 로봇" },
              { id: "extended-care-digital", name: "정서 케어 콘텐츠" },
            ],
          },
        ],
      },
    ],
  },
  {
    type: "국가전략기술분류",
    shortLabel: "전략기술",
    description: "국가 차원의 전략기술 투자 분야를 정리한 분류입니다.",
    accentClassName: "from-cyan-500/20 via-cyan-500/5 to-transparent",
    large: [
      {
        id: "strategic-semiconductor",
        name: "반도체/디스플레이",
        medium: [
          {
            id: "strategic-ai-chip",
            name: "차세대반도체",
            small: [
              { id: "strategic-ai-chip-npu", name: "AI 가속기 설계" },
              { id: "strategic-ai-chip-memory", name: "고대역폭 메모리" },
              { id: "strategic-ai-chip-packaging", name: "첨단 패키징" },
            ],
          },
          {
            id: "strategic-display",
            name: "차세대디스플레이",
            small: [
              { id: "strategic-display-microled", name: "마이크로 LED" },
              { id: "strategic-display-oxides", name: "산화물 TFT 공정" },
              { id: "strategic-display-ar", name: "XR용 초고해상도 패널" },
            ],
          },
        ],
      },
      {
        id: "strategic-space-energy",
        name: "우주/에너지",
        medium: [
          {
            id: "strategic-space",
            name: "우주항공",
            small: [
              { id: "strategic-space-satellite", name: "초소형 위성체계" },
              { id: "strategic-space-observation", name: "지구관측 데이터 활용" },
              { id: "strategic-space-ground", name: "지상국 자동운영" },
            ],
          },
          {
            id: "strategic-energy",
            name: "차세대에너지",
            small: [
              { id: "strategic-energy-storage", name: "에너지 저장시스템" },
              { id: "strategic-energy-grid", name: "지능형 전력망" },
              { id: "strategic-energy-hydrogen", name: "수소 활용 시스템" },
            ],
          },
        ],
      },
    ],
  },
]

export const MOCK_TECH_STANDARD_RESPONSE: TechStandardResponse = {
  project_id: "project-mock-001",
  categories: [
    {
      type: "국가과학기술표준분류",
      keywords: [
        { id: "nesti-ai-vision", name: "컴퓨터비전 응용", percentage: 50 },
        { id: "nesti-data-platform", name: "클라우드 데이터 플랫폼", percentage: 30 },
        { id: "nesti-mobility-sim", name: "디지털 시뮬레이션", percentage: 20 },
      ],
    },
    {
      type: "산업기술분류(2024년도)",
      keywords: [
        { id: "industry-software-twin", name: "산업용 디지털트윈", percentage: 60 },
        { id: "industry-device-edge", name: "온디바이스 AI", percentage: 40 },
      ],
    },
    {
      type: "중소기업_전략기술로드맵",
      keywords: [
        { id: "sme-smart-factory-qc", name: "비전 품질검사", percentage: 45 },
        { id: "sme-smart-factory-maintenance", name: "예지보전", percentage: 35 },
        { id: "sme-carbon-neutral-report", name: "환경성과 리포팅", percentage: 20 },
      ],
    },
    {
      type: "6T관련기술코드",
      keywords: [
        { id: "6t-it-ai-language", name: "언어지능", percentage: 70 },
        { id: "6t-it-network-security", name: "융합 보안", percentage: 30 },
      ],
    },
    {
      type: "국가과가학기술표준분류",
      keywords: [
        { id: "extended-human-ai-safety", name: "신뢰가능 AI", percentage: 55 },
        { id: "extended-disaster-command", name: "통합상황판", percentage: 45 },
      ],
    },
    {
      type: "국가전략기술분류",
      keywords: [
        { id: "strategic-ai-chip-npu", name: "AI 가속기 설계", percentage: 50 },
        { id: "strategic-display-ar", name: "XR용 초고해상도 패널", percentage: 25 },
        { id: "strategic-space-satellite", name: "초소형 위성체계", percentage: 25 },
      ],
    },
  ],
}

export function createEmptySelectionSlots(): TechStandardSelectionSlot[] {
  return [
    { slot: 1, largeId: "", mediumId: "", smallId: "", percentage: 0 },
    { slot: 2, largeId: "", mediumId: "", smallId: "", percentage: 0 },
    { slot: 3, largeId: "", mediumId: "", smallId: "", percentage: 0 },
  ]
}

export function getClassificationPath(
  system: TechStandardSystemDefinition,
  smallId: string
): TechStandardSelectionPath | null {
  for (const large of system.large) {
    for (const medium of large.medium) {
      const small = medium.small.find((item) => item.id === smallId)
      if (small) {
        return { large, medium, small }
      }
    }
  }

  return null
}

export function getMediumOptions(system: TechStandardSystemDefinition, largeId: string) {
  return system.large.find((item) => item.id === largeId)?.medium ?? []
}

export function getSmallOptions(
  system: TechStandardSystemDefinition,
  largeId: string,
  mediumId: string
) {
  return getMediumOptions(system, largeId).find((item) => item.id === mediumId)?.small ?? []
}

export function buildInitialSelections(response: TechStandardResponse) {
  const categoryMap = new Map(
    response.categories.map((category) => [category.type, category.keywords] as const)
  )

  return Object.fromEntries(
    MOCK_TECH_STANDARD_SYSTEMS.map((system) => {
      const slots = createEmptySelectionSlots()
      const keywords = categoryMap.get(system.type) ?? []

      keywords.slice(0, 3).forEach((keyword, index) => {
        const path = getClassificationPath(system, keyword.id)
        if (!path) return

        slots[index] = {
          slot: (index + 1) as 1 | 2 | 3,
          largeId: path.large.id,
          mediumId: path.medium.id,
          smallId: path.small.id,
          percentage: keyword.percentage,
        }
      })

      return [system.type, slots]
    })
  ) as Record<TechStandardSystemType, TechStandardSelectionSlot[]>
}

/**
 * Legacy mock exports kept for compatibility with earlier search-based UI files.
 * 새로운 페이지는 상단의 MOCK_TECH_STANDARD_SYSTEMS / RESPONSE를 사용합니다.
 */
export interface ClassificationItem {
  code: string
  name: string
  path: string
}

export const MOCK_CLASSIFICATIONS: ClassificationItem[] = [
  { code: "350101", name: "컴퓨터비전", path: "공학 > 컴퓨터공학 > 영상처리" },
  { code: "350102", name: "딥러닝", path: "공학 > 컴퓨터공학 > 인공지능" },
  { code: "350103", name: "객체탐지", path: "공학 > 컴퓨터공학 > 영상처리" },
  { code: "350201", name: "건설안전", path: "공학 > 건축공학 > 건설관리" },
  { code: "350202", name: "PPE", path: "공학 > 안전공학 > 산업안전" },
  { code: "350203", name: "실시간감시", path: "공학 > 컴퓨터공학 > 영상처리" },
  { code: "350301", name: "BIM", path: "공학 > 건축공학 > 건축정보" },
  { code: "350302", name: "LiDAR", path: "공학 > 지리공학 > 측량" },
  { code: "350401", name: "강화학습", path: "공학 > 컴퓨터공학 > 인공지능" },
  { code: "350402", name: "자율주행", path: "공학 > 기계공학 > 자동화" },
  { code: "350403", name: "시뮬레이션", path: "공학 > 컴퓨터공학 > 시뮬레이션" },
]

export interface SelectedClassification {
  rank: 1 | 2 | 3
  item: ClassificationItem
  ratio: number
}

export const SUGGESTED_KEYWORDS = ["컴퓨터비전", "건설안전", "인공지능", "객체탐지"]
