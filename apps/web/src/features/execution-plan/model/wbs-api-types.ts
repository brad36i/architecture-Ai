/**
 * GET/POST /api/v2/projects/{project_id}/wbs, POST .../wbs/generate
 * — OpenAPI WbsGenerateResponse
 */

export interface WbsTaskApi {
  taskId: string
  name: string
  startDate: string
  endDate: string
}

export interface WbsWorkPackageApi {
  wpId: string
  name: string
  tasks?: WbsTaskApi[]
}

export interface WbsYearApi {
  year: number
  startDate: string
  endDate: string
  workPackages?: WbsWorkPackageApi[]
}

export interface WbsMilestoneApi {
  name: string
  year: number
  date: string
}

export interface WbsGenerateResponseData {
  years: WbsYearApi[]
  milestones: WbsMilestoneApi[]
}

export interface BaseResponseWbs {
  success: boolean
  statusCode?: number
  message?: string
  data: WbsGenerateResponseData | null
}
