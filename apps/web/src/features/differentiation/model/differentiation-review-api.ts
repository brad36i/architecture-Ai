import type { ComparisonResearch, DifferentiationReviewData } from "./types"

export interface BaseResponse<T> {
  success: boolean
  statusCode: number
  data: T | null
}

/** OpenAPI `ResearchComparisonItem` */
export interface ResearchComparisonItemApi {
  name: string
  attributes?: Record<string, string>
}

const NO_REVIEW_DETAIL = "저장된 차별성 검토가 없습니다."

export function isDetailOnlyPayload(data: unknown): data is { detail: string } {
  if (!data || typeof data !== "object") return false
  const o = data as Record<string, unknown>
  const keys = Object.keys(o)
  return keys.length === 1 && keys[0] === "detail" && typeof o.detail === "string"
}

export function mapApiToDifferentiationReviewData(
  data: unknown,
  fallbackProjectId: string
): DifferentiationReviewData | null {
  if (!data || typeof data !== "object" || isDetailOnlyPayload(data)) return null
  const d = data as Record<string, unknown>
  const projectId =
    typeof d.projectId === "string" && d.projectId.trim()
      ? d.projectId
      : fallbackProjectId

  const rwc = d.relatedWorkComparison
  const rawList =
    rwc && typeof rwc === "object" && Array.isArray((rwc as { researches?: unknown }).researches)
      ? ((rwc as { researches: ResearchComparisonItemApi[] }).researches)
      : []

  const researches: ComparisonResearch[] = rawList.map((r, i) => ({
    id: `comparison-${i}`,
    name: typeof r.name === "string" && r.name.trim() ? r.name : `연구 ${i + 1}`,
    attributes: Object.entries(r.attributes ?? {}).map(([label, value]) => ({
      label,
      value: String(value),
    })),
  }))

  const summaries = Array.isArray(d.differentiationSummary)
    ? d.differentiationSummary.filter((x): x is string => typeof x === "string")
    : []
  const recommendations = Array.isArray(d.improvementRecommendations)
    ? d.improvementRecommendations.filter((x): x is string => typeof x === "string")
    : []

  return {
    projectId,
    relatedWorkComparison: { researches },
    differentiationSummary: summaries,
    improvementRecommendations: recommendations,
  }
}

export function parseDifferentiationReviewGet(
  json: BaseResponse<unknown>,
  projectId: string
): { kind: "empty"; detail: string } | { kind: "review"; data: DifferentiationReviewData } {
  const data = json.data
  if (isDetailOnlyPayload(data)) {
    return { kind: "empty", detail: data.detail }
  }
  if (data == null) {
    return { kind: "empty", detail: NO_REVIEW_DETAIL }
  }
  const mapped = mapApiToDifferentiationReviewData(data, projectId)
  if (!mapped) {
    return { kind: "empty", detail: NO_REVIEW_DETAIL }
  }
  return { kind: "review", data: mapped }
}
