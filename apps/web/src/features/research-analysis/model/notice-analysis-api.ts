import type { Notice, NoticeOverview, SubProgram } from "./notice"

/** OpenAPI `NoticeOverview` */
export type NoticeOverviewApi = {
  background?: string | null
  objective?: string | null
  content?: string | null
}

/** OpenAPI `NoticeEvaluationItem` */
export interface NoticeEvaluationItemApi {
  item?: string
  metric?: string
  scoreMax?: number
}

/** OpenAPI `NoticeAnalysisSubmissionChecklistItem` */
export interface NoticeAnalysisSubmissionChecklistItemApi {
  id?: string
  type?: string
  content?: string
  groupPath?: string[]
  required?: boolean
  source?: string
  description?: string
}

/** OpenAPI `NoticeAnalysisData` — GET /api/v2/projects/{project_id}/notice/analysis */
export interface NoticeAnalysisData {
  noticeId?: string | null
  noticeDisplayId?: string | null
  noticeTitle?: string | null
  ministryNames?: string[]
  orderAgencyName?: string | null
  noticeTypes?: string[]
  noticeStatus?: string | null
  programNames?: string[]
  keywords?: string[]
  availableOrgs?: string[]
  programBudget?: string | null
  fundings?: string | null
  fundingDetail?: string | null
  fundingRate?: string | null
  period?: string | null
  consortiumRequirement?: string | null
  consortiumStructure?: string | null
  summary?: string | null
  overview?: NoticeOverviewApi | null
  trlLevel?: string | null
  commonRequirements?: string | null
  investigatorRequirements?: string | null
  researchLabRequirements?: string | null
  locationRequirements?: string | null
  concurrentProjectLimit?: string | null
  additionalRequirements?: string | null
  subPrograms?: SubProgramItem[] | null
  evaluation?: NoticeEvaluationItemApi[] | null
  submissionChecklistTemplate?: NoticeAnalysisSubmissionChecklistItemApi[] | null
}

export interface SubProgramItem {
  id?: string | null
  title?: string | null
  programName?: string | null
  keywords?: string[]
  period?: string | null
  budget?: unknown
  funding?: string | null
  fundingDetail?: string | null
  fundingRate?: string | null
  trlLevel?: string | null
  summary?: string | null
  overview?: NoticeOverviewApi | null
}

export interface BaseResponse<T> {
  success: boolean
  statusCode: number
  data: T | null
}

const emptyOverview: NoticeOverview = {
  background: "",
  objective: "",
  content: "",
}

function formatBudget(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === "string") return v.trim() || null
  if (typeof v === "number" && Number.isFinite(v)) return String(v)
  return null
}

function mapOverview(
  o: NoticeAnalysisData["overview"] | SubProgramItem["overview"]
): NoticeOverview {
  if (!o) return emptyOverview
  return {
    background: o.background ?? "",
    objective: o.objective ?? "",
    content: o.content ?? "",
  }
}

function mapSubProgram(item: SubProgramItem): SubProgram {
  return {
    id: item.id ?? crypto.randomUUID(),
    title: item.title ?? "",
    program_name: item.programName ?? null,
    keywords: item.keywords ?? [],
    period: item.period ?? "",
    budget: formatBudget(item.budget),
    funding: item.funding ?? "",
    funding_detail: item.fundingDetail ?? "",
    funding_rate: item.fundingRate ?? "",
    trl_level: item.trlLevel ?? null,
    summary: item.summary ?? null,
    overview: item.overview ? mapOverview(item.overview) : null,
  }
}

export function mapNoticeAnalysisToNotice(data: NoticeAnalysisData): Notice {
  const overview = data.overview ? mapOverview(data.overview) : emptyOverview
  const programNames = data.programNames?.join(", ") ?? ""

  return {
    notice_id: data.noticeId ?? "",
    notice_display_id: data.noticeDisplayId ?? "",
    notice_name: data.noticeTitle ?? "",
    title: data.noticeTitle ?? "",
    ministry_names: data.ministryNames ?? [],
    order_agency_name: data.orderAgencyName ?? "",
    notice_types: data.noticeTypes ?? [],
    status: data.noticeStatus ?? "",
    program_names: programNames,
    keywords: data.keywords ?? [],
    available_orgs: data.availableOrgs ?? [],

    program_budget: data.programBudget ?? "",
    fundings: data.fundings ?? "",
    funding_detail: data.fundingDetail ?? "",
    funding_rate: data.fundingRate ?? "",
    period: data.period ?? "",

    consortium_requirement: data.consortiumRequirement ?? null,
    consortium_structure: data.consortiumStructure ?? null,

    summary: data.summary ?? "",
    overview,
    trl_level: data.trlLevel ?? null,

    common_requirements: data.commonRequirements ?? "",
    investigator_requirements: data.investigatorRequirements ?? "",
    research_lab_requirements: data.researchLabRequirements ?? null,
    location_requirements: data.locationRequirements ?? null,
    concurrent_project_limit: data.concurrentProjectLimit ?? "",

    additional_requirements: data.additionalRequirements ?? null,

    sub_programs: data.subPrograms?.map(mapSubProgram) ?? null,

    evaluation: (data.evaluation ?? []).map((row) => ({
      item: row.item ?? "",
      metric: row.metric ?? "",
      score_max: typeof row.scoreMax === "number" ? row.scoreMax : 0,
    })),

    submission_checklist_template: (data.submissionChecklistTemplate ?? []).map(
      (row) => ({
        id: row.id ?? "",
        type: row.type ?? "notice",
        content: row.content ?? "",
        group_path: row.groupPath ?? [],
        required: row.required ?? true,
        source: row.source ?? "",
        description: row.description ?? "",
      })
    ),
  }
}
