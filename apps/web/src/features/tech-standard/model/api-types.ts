"use client"

export interface BaseResponse<T> {
  success: boolean
  statusCode: number
  data: T | null
  message?: string
}

export interface TechClassificationGroupedItem {
  rank: number
  code: string
  name: string
  fullCodeName: string
  l1: string
  l2: string
  l3: string
  taxonomyFamily: string
  weight: number | null
  confidence: number | null
  scores: Record<string, number>
  reasons: string[]
  isPlaceholder: boolean
}

export interface TechClassificationGroup {
  taxonomyFamily: string
  taxonomyFamilyLabel: string
  selectedCount: number
  targetCount: number
  weightSum: number
  validated: boolean
  aiRationale: string
  items: TechClassificationGroupedItem[]
}

export interface TechClassificationResponse {
  domain: string
  coreTechnologies: string[]
  groupedRecommendations: TechClassificationGroup[]
  warnings: string[]
}

export interface TechClassificationPostBody {
  topK?: number
}

export type TechClassificationQueryState =
  | { kind: "empty"; detail: string }
  | { kind: "classification"; data: TechClassificationResponse }

const NO_TECH_CLASSIFICATION_DETAIL = "저장된 기술표준분류가 없습니다."

function toStringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function toNumberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function toNullableNumberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function toBooleanValue(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function toNumberRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, number] => typeof entry[1] === "number")
  )
}

function normalizeGroupedItem(value: unknown, index: number): TechClassificationGroupedItem {
  const item = value && typeof value === "object" ? (value as Record<string, unknown>) : {}

  return {
    rank: toNumberValue(item.rank, index + 1),
    code: toStringValue(item.code, "-"),
    name: toStringValue(item.name, "-"),
    fullCodeName: toStringValue(item.fullCodeName, "-"),
    l1: toStringValue(item.l1, "-"),
    l2: toStringValue(item.l2, "-"),
    l3: toStringValue(item.l3, "-"),
    taxonomyFamily: toStringValue(item.taxonomyFamily),
    weight: toNullableNumberValue(item.weight),
    confidence: toNullableNumberValue(item.confidence),
    scores: toNumberRecord(item.scores),
    reasons: toStringArray(item.reasons),
    isPlaceholder: toBooleanValue(item.isPlaceholder),
  }
}

function normalizeGroup(value: unknown, index: number): TechClassificationGroup {
  const group = value && typeof value === "object" ? (value as Record<string, unknown>) : {}
  const items = Array.isArray(group.items)
    ? group.items.map((item, itemIndex) => normalizeGroupedItem(item, itemIndex))
    : []

  return {
    taxonomyFamily: toStringValue(group.taxonomyFamily, `group-${index + 1}`),
    taxonomyFamilyLabel: toStringValue(group.taxonomyFamilyLabel, `분류체계 ${index + 1}`),
    selectedCount: toNumberValue(group.selectedCount, items.filter((item) => !item.isPlaceholder).length),
    targetCount: toNumberValue(group.targetCount, 3),
    weightSum: toNumberValue(group.weightSum, 0),
    validated: toBooleanValue(group.validated),
    aiRationale: toStringValue(group.aiRationale),
    items,
  }
}

export function isDetailOnlyPayload(data: unknown): data is { detail: string } {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false
  const payload = data as Record<string, unknown>
  const keys = Object.keys(payload)
  return keys.length === 1 && keys[0] === "detail" && typeof payload.detail === "string"
}

export function mapApiToTechClassificationResponse(
  data: unknown
): TechClassificationResponse | null {
  if (!data || typeof data !== "object" || Array.isArray(data) || isDetailOnlyPayload(data)) {
    return null
  }

  const payload = data as Record<string, unknown>
  const groupedRecommendations = Array.isArray(payload.groupedRecommendations)
    ? payload.groupedRecommendations.map((group, index) => normalizeGroup(group, index))
    : []

  return {
    domain: toStringValue(payload.domain),
    coreTechnologies: toStringArray(payload.coreTechnologies),
    groupedRecommendations,
    warnings: toStringArray(payload.warnings),
  }
}

export function parseTechClassificationGet(
  json: BaseResponse<unknown>
): TechClassificationQueryState {
  if (isDetailOnlyPayload(json.data)) {
    return { kind: "empty", detail: json.data.detail }
  }

  if (json.data == null) {
    return { kind: "empty", detail: NO_TECH_CLASSIFICATION_DETAIL }
  }

  const mapped = mapApiToTechClassificationResponse(json.data)

  if (!mapped || mapped.groupedRecommendations.length === 0) {
    return { kind: "empty", detail: NO_TECH_CLASSIFICATION_DETAIL }
  }

  return { kind: "classification", data: mapped }
}
