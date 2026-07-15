/**
 * Mock 도식/표 유형 및 초안 데이터
 * 추후 연구계획서 store 연동 시 AI 생성으로 교체
 */

export type DiagramTableType = "concept" | "roadmap" | "gantt" | "comparison"

export interface DiagramTypeItem {
  id: DiagramTableType
  label: string
  description: string
  badge?: string
}

export const DIAGRAM_TYPES: DiagramTypeItem[] = [
  {
    id: "concept",
    label: "연구개념도",
    description: "연구의 개념적 구조, 구성요소 관계를 시각화",
    badge: "필수",
  },
  {
    id: "roadmap",
    label: "기술로드맵",
    description: "연차별 기술 개발 단계와 목표",
  },
  {
    id: "gantt",
    label: "Gantt 일정표",
    description: "과제별 일정 및 마일스톤",
    badge: "필수",
  },
  {
    id: "comparison",
    label: "선행기술 비교표",
    description: "국내외 선행연구와의 차별점 비교",
  },
]

export interface DiagramDraft {
  type: DiagramTableType
  title: string
  content: string
  /** 테이블인 경우 2차원 배열 */
  tableData?: string[][]
}

const MOCK_CONCEPT_DIAGRAM = `[연구 배경] → [문제 정의] → [연구 목적]
        ↓
[선행연구 분석] → [기술 갭]
        ↓
[연구 방법] → [기대 효과]`

const MOCK_ROADMAP = `1년차: 기초연구·요구사항 분석
2년차: 핵심 기술 개발·프로토타입
3년차: 검증·사업화 연계`

const MOCK_GANTT_TABLE = [
  ["과제", "1년 1~6월", "1년 7~12월", "2년 1~6월", "2년 7~12월"],
  ["요구사항 분석", "■■■■■■", "-", "-", "-"],
  ["핵심 기술 개발", "-", "■■■■■■", "■■■■■■", "-"],
  ["프로토타입 제작", "-", "-", "■■■■■■", "■■■■■■"],
  ["검증 및 평가", "-", "-", "-", "■■■■■■"],
]

const MOCK_COMPARISON_TABLE = [
  ["구분", "선행연구 A", "선행연구 B", "본 과제"],
  ["기술", "기존 방식", "개선 방식", "AI 융합 방식"],
  ["정확도", "약 80%", "약 85%", "95% 목표"],
  ["실시간성", "X", "△", "O"],
]

export function getMockDraft(type: DiagramTableType): DiagramDraft {
  switch (type) {
    case "concept":
      return {
        type: "concept",
        title: "연구개념도 초안",
        content: MOCK_CONCEPT_DIAGRAM,
      }
    case "roadmap":
      return {
        type: "roadmap",
        title: "기술로드맵 초안",
        content: MOCK_ROADMAP,
      }
    case "gantt":
      return {
        type: "gantt",
        title: "Gantt 일정표 초안",
        content: "",
        tableData: MOCK_GANTT_TABLE,
      }
    case "comparison":
      return {
        type: "comparison",
        title: "선행기술 비교표 초안",
        content: "",
        tableData: MOCK_COMPARISON_TABLE,
      }
  }
}

/** 저장된 도식/표 아티팩트 (좌측 목록용) */
export interface DiagramArtifact {
  id: string
  type: DiagramTableType
  caption: string
  createdAt: string
  /** 썸네일 이미지 URL (선택, 없으면 타입별 placeholder) */
  thumbnailUrl?: string
  draft: DiagramDraft
}

export const MOCK_ARTIFACTS: DiagramArtifact[] = [
  {
    id: "1",
    type: "concept",
    caption: "연구개념도 v1",
    createdAt: "2025-02-10",
    draft: getMockDraft("concept"),
  },
  {
    id: "2",
    type: "gantt",
    caption: "Gantt 일정표 초안",
    createdAt: "2025-02-12",
    draft: getMockDraft("gantt"),
  },
  {
    id: "3",
    type: "comparison",
    caption: "선행기술 비교표",
    createdAt: "2025-02-14",
    draft: getMockDraft("comparison"),
  },
  {
    id: "4",
    type: "roadmap",
    caption: "기술로드맵",
    createdAt: "2025-02-15",
    draft: getMockDraft("roadmap"),
  },
]
