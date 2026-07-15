import type { GanttTask, MilestoneItem } from "@/features/execution-plan/model/mock"
import type { WbsGenerateResponseData } from "@/features/execution-plan/model/wbs-api-types"

function parseYmd(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

/** 연차 시작일 기준 1~12개월 칸 (프로젝트 연차) */
function monthIndexInProjectYear(yearStartStr: string, dateStr: string): number {
  const ys = parseYmd(yearStartStr)
  const d = parseYmd(dateStr)
  const idx =
    (d.getFullYear() - ys.getFullYear()) * 12 + (d.getMonth() - ys.getMonth()) + 1
  return Math.min(12, Math.max(1, idx))
}

function clampMonthPair(start: number, end: number): { startMonth: number; endMonth: number } {
  if (end < start) return { startMonth: end, endMonth: start }
  return { startMonth: start, endMonth: end }
}

export function mapWbsToGanttTasks(data: WbsGenerateResponseData): GanttTask[] {
  const tasks: GanttTask[] = []
  for (const y of data.years ?? []) {
    const yearNum = y.year
    const anchor = y.startDate
    for (const wp of y.workPackages ?? []) {
      for (const t of wp.tasks ?? []) {
        const sm = monthIndexInProjectYear(anchor, t.startDate)
        const em = monthIndexInProjectYear(anchor, t.endDate)
        const { startMonth, endMonth } = clampMonthPair(sm, em)
        tasks.push({
          id: t.taskId,
          name: t.name,
          year: yearNum,
          startMonth,
          endMonth,
        })
      }
    }
  }
  return tasks
}

function formatMilestoneDate(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso.replace(/-/g, ".")
  return iso
}

export function mapWbsToMilestones(data: WbsGenerateResponseData): MilestoneItem[] {
  return (data.milestones ?? []).map((m, i) => ({
    id: `${m.year}-${m.date}-${i}`,
    title: m.name,
    dueDate: formatMilestoneDate(m.date),
    deliverable: `${m.year}년차`,
    status: "planned" as const,
  }))
}

export function isWbsEmpty(data: WbsGenerateResponseData | null | undefined): boolean {
  if (!data) return true
  const years = data.years ?? []
  if (years.length === 0) return true
  return !years.some((y) => (y.workPackages ?? []).some((wp) => (wp.tasks ?? []).length > 0))
}
