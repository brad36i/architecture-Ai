export interface BaseResponse<T> {
  success: boolean
  statusCode: number
  data: T | null
  message?: string
}

export interface RBEvaluationSummary {
  totalScore: number
  maxScore: number
  overallComment: string
}

export interface RBEvaluationItem {
  itemName: string
  maxScore: number
  score: number
  evidence: string[]
  reasoning: string
  improvement: string
}

export interface RBEvaluationCategory {
  id: string
  categoryName: string
  categoryMaxScore: number
  categoryScore: number
  items: RBEvaluationItem[]
}

export interface RBEvaluationLegacyEvaluator {
  evaluatorId: number
  comment: string
}

export interface RBEvaluationLegacy {
  evaluators: RBEvaluationLegacyEvaluator[]
}

export interface RBEvaluationResponse {
  projectId: string
  evaluationSummary: RBEvaluationSummary
  ezrnd: RBEvaluationCategory[]
  legacy: RBEvaluationLegacy
}

export type RBEvaluationQueryState =
  | { kind: "empty"; detail: string }
  | { kind: "evaluation"; data: RBEvaluationResponse }

const NO_RB_EVALUATION_DETAIL = "저장된 전문기관 평가의견이 없습니다."

function toStringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function toNumberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function normalizeItem(value: unknown): RBEvaluationItem {
  const item = value && typeof value === "object" ? (value as Record<string, unknown>) : {}

  return {
    itemName: toStringValue(item.itemName),
    maxScore: toNumberValue(item.maxScore),
    score: toNumberValue(item.score),
    evidence: toStringArray(item.evidence),
    reasoning: toStringValue(item.reasoning),
    improvement: toStringValue(item.improvement),
  }
}

function normalizeCategory(value: unknown, index: number): RBEvaluationCategory {
  const category = value && typeof value === "object" ? (value as Record<string, unknown>) : {}

  return {
    id: toStringValue(category.id, `category-${index + 1}`),
    categoryName: toStringValue(category.categoryName, `카테고리 ${index + 1}`),
    categoryMaxScore: toNumberValue(category.categoryMaxScore),
    categoryScore: toNumberValue(category.categoryScore),
    items: Array.isArray(category.items) ? category.items.map(normalizeItem) : [],
  }
}

function normalizeLegacyEvaluator(value: unknown, index: number): RBEvaluationLegacyEvaluator {
  const evaluator = value && typeof value === "object" ? (value as Record<string, unknown>) : {}

  return {
    evaluatorId: toNumberValue(evaluator.evaluatorId, index + 1),
    comment: toStringValue(evaluator.comment),
  }
}

export function isDetailOnlyPayload(data: unknown): data is { detail: string } {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false
  const payload = data as Record<string, unknown>
  const keys = Object.keys(payload)
  return keys.length === 1 && keys[0] === "detail" && typeof payload.detail === "string"
}

export function mapApiToRBEvaluationResponse(
  data: unknown,
  fallbackProjectId: string
): RBEvaluationResponse | null {
  if (!data || typeof data !== "object" || Array.isArray(data) || isDetailOnlyPayload(data)) {
    return null
  }

  const payload = data as Record<string, unknown>
  const summaryValue =
    payload.evaluationSummary && typeof payload.evaluationSummary === "object"
      ? (payload.evaluationSummary as Record<string, unknown>)
      : {}
  const legacyValue =
    payload.legacy && typeof payload.legacy === "object"
      ? (payload.legacy as Record<string, unknown>)
      : {}

  return {
    projectId: toStringValue(payload.projectId, fallbackProjectId),
    evaluationSummary: {
      totalScore: toNumberValue(summaryValue.totalScore),
      maxScore: toNumberValue(summaryValue.maxScore),
      overallComment: toStringValue(summaryValue.overallComment),
    },
    ezrnd: Array.isArray(payload.ezrnd)
      ? payload.ezrnd.map((category, index) => normalizeCategory(category, index))
      : [],
    legacy: {
      evaluators: Array.isArray(legacyValue.evaluators)
        ? legacyValue.evaluators.map((evaluator, index) => normalizeLegacyEvaluator(evaluator, index))
        : [],
    },
  }
}

export function parseRBEvaluationGet(
  json: BaseResponse<unknown>,
  projectId: string
): RBEvaluationQueryState {
  if (isDetailOnlyPayload(json.data)) {
    return { kind: "empty", detail: json.data.detail }
  }

  if (json.data == null) {
    return { kind: "empty", detail: NO_RB_EVALUATION_DETAIL }
  }

  const mapped = mapApiToRBEvaluationResponse(json.data, projectId)
  const hasEzrnd = Boolean(mapped?.ezrnd.length)
  const hasLegacy = Boolean(mapped?.legacy.evaluators.length)

  if (!mapped || (!hasEzrnd && !hasLegacy)) {
    return { kind: "empty", detail: NO_RB_EVALUATION_DETAIL }
  }

  return { kind: "evaluation", data: mapped }
}
