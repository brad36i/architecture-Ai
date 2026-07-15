/**
 * Mock 실행계획 데이터
 * 추후 연구계획서·RB평가 결과 연동
 */

export interface GanttTask {
  id: string
  name: string
  year: number
  startMonth: number
  endMonth: number
}

export const MOCK_GANTT_TASKS: GanttTask[] = [
  { id: "1", name: "요구사항 분석", year: 1, startMonth: 1, endMonth: 6 },
  { id: "2", name: "핵심 기술 개발", year: 1, startMonth: 7, endMonth: 12 },
  { id: "3", name: "프로토타입 제작", year: 2, startMonth: 1, endMonth: 6 },
  { id: "4", name: "검증 및 평가", year: 2, startMonth: 7, endMonth: 12 },
]

export interface MilestoneItem {
  id: string
  title: string
  dueDate: string
  deliverable: string
  status: "planned" | "completed"
}

export const MOCK_MILESTONES: MilestoneItem[] = [
  {
    id: "1",
    title: "1차 중간보고",
    dueDate: "2025.06",
    deliverable: "중간보고서, 시연영상",
    status: "planned",
  },
  {
    id: "2",
    title: "핵심 모듈 완료",
    dueDate: "2025.12",
    deliverable: "프로토타입, 기술보고서",
    status: "planned",
  },
  {
    id: "3",
    title: "최종 보고",
    dueDate: "2026.06",
    deliverable: "최종보고서, 특허출원",
    status: "planned",
  },
]
