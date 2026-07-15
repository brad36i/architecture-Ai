/**
 * GET/POST/DELETE /api/v2/projects/{project_id}/prior/research
 * GET /api/v2/projects/{project_id}/prior/research/{research_id}
 * — OpenAPI `PriorResearch*` 스키마와 동일한 필드명
 */

import type { DocumentType, SearchHistory, SearchResult } from "./types"

export interface BaseResponse<T> {
  success: boolean
  statusCode: number
  data: T | null
}

/** OpenAPI `PriorResearchAddRequest` */
export interface PriorResearchAddRequest {
  content?: string | null
}

/** OpenAPI `PriorResearchCounts` */
export interface PriorResearchCounts {
  total?: number
  researchProjects?: number
  papers?: number
  patents?: number
  reports?: number
  articlesBlogs?: number
}

/** OpenAPI `PriorResearchResponse` — 목록·POST 201 */
export interface PriorResearchResponse {
  id?: string
  createdAt: string
  title: string
  isAuto?: boolean
  topicDeleted?: boolean
  counts?: PriorResearchCounts
}

/** OpenAPI `PriorResearchRaw` (+ additionalProperties) */
export interface PriorResearchRaw {
  collection?: string | null
  title?: string | null
  sourceId?: string | number | null
  dataType?: string | null
  outcomeSubtype?: string | null
  projectId?: number | string | null
  organization?: string | null
  principalInvestigatorAffiliation?: string | null
  year?: number | null
  keywordsKo?: string | null
  keywordsEn?: string | null
  summary?: string | null
  ntisId?: string | null
  applicationNumber?: string | null
  registrationNumber?: string | null
  journal?: string | null
  journal_name?: string | null
  mainAuthor?: string | null
  author?: string | null
  sciFlag?: string | null
  doi?: string | null
  abstract?: string | null
  keyword?: string | null
  fulltext_url?: string | null
  content_url?: string | null
  /** 원본에만 있을 수 있는 링크 (metadata.url 폴백) */
  url?: string | null
  /** 특허: 출원인(문자열, 다수일 때 구분자는 API 원문 따름) */
  applicants?: string | null
  /** 특허: 출원일 `YYYYMMDD` */
  appl_date?: string | null
  /** 특허: 등록일 `YYYYMMDD` */
  grant_date?: string | null
}

/** OpenAPI `PriorResearchMetadata` */
export interface PriorResearchMetadata {
  sourceType?: string | null
  year?: number | null
  url?: string | null
  fieldTags?: string[]
  methodTags?: string[]
  dataTags?: string[]
  citations?: number | null
  raw?: PriorResearchRaw | null
}

/** OpenAPI `PriorResearchItem` */
export interface PriorResearchItem {
  id: string
  title?: string
  content?: string
  score?: number
  metadata?: PriorResearchMetadata
}

/** OpenAPI `PriorResearchDetail` */
export interface PriorResearchDetail {
  researchProjects?: PriorResearchItem[]
  papers?: PriorResearchItem[]
  patents?: PriorResearchItem[]
  reports?: PriorResearchItem[]
  articlesBlogs?: PriorResearchItem[]
}

/** OpenAPI `PriorResearchDetailResponse` */
export interface PriorResearchDetailResponse {
  id?: string
  createdAt: string
  title: string
  isAuto?: boolean
  topicDeleted?: boolean
  counts?: PriorResearchCounts
  detail?: PriorResearchDetail
}

/** OpenAPI `PriorResearchIdOnlyResponse` — DELETE 200 */
export interface PriorResearchIdOnlyResponse {
  researchId: string
}

export type PriorResearchListApiResponse = BaseResponse<PriorResearchResponse[]>
export type PriorResearchSingleApiResponse = BaseResponse<PriorResearchResponse>
export type PriorResearchDetailApiResponse = BaseResponse<PriorResearchDetailResponse>
export type PriorResearchDeleteApiResponse = BaseResponse<PriorResearchIdOnlyResponse>

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function parseYyyymmdd(value?: string | null) {
  const s = value?.trim()
  if (!s || !/^\d{8}$/.test(s)) return undefined
  const y = Number(s.slice(0, 4))
  const m = Number(s.slice(4, 6))
  const d = Number(s.slice(6, 8))
  if (m < 1 || m > 12 || d < 1 || d > 31) return undefined
  const iso = `${y.toString().padStart(4, "0")}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`
  const t = Date.parse(iso)
  return Number.isFinite(t) ? iso : undefined
}

function buildPublishedAt(metadata?: PriorResearchMetadata, type?: DocumentType) {
  const raw = metadata?.raw
  if (type === "patent") {
    const grant = parseYyyymmdd(raw?.grant_date)
    if (grant) return grant
    const appl = parseYyyymmdd(raw?.appl_date)
    if (appl) return appl
  }
  const year = metadata?.year ?? raw?.year
  return year ? `${year}-01-01` : "1970-01-01"
}

function splitKeywords(value?: string | null) {
  if (!value) return []
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function stripHtml(value?: string | null) {
  if (!value) return ""

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/\s+/g, " ")
    .trim()
}

function splitAuthors(value?: string | null) {
  if (!value) return []
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
}

function uniqueStrings(items: Array<string | undefined | null>) {
  return [...new Set(items.map((item) => item?.trim()).filter(Boolean) as string[])]
}

function normalizeSimilarity(score?: number) {
  if (typeof score !== "number" || !Number.isFinite(score)) return 0
  const normalized = score <= 1 ? score * 100 : score
  return Math.max(0, Math.min(100, Math.round(normalized)))
}

function normalizeDoi(doi?: string | null) {
  const trimmed = doi?.trim()
  if (!trimmed) return undefined

  const normalized = trimmed.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "").trim()
  return normalized || undefined
}

function buildDoiUrl(doi?: string | null) {
  const normalized = normalizeDoi(doi)
  return normalized ? `https://doi.org/${normalized}` : undefined
}

/** `null`/`undefined`/공백만 있는 문자열은 무시 (`"" ?? fallback`이 막히는 경우 방지) */
function firstNonEmptyUrl(
  ...candidates: Array<string | null | undefined>
): string | undefined {
  for (const c of candidates) {
    if (typeof c !== "string") continue
    const t = c.trim()
    if (t.length > 0) return t
  }
  return undefined
}

/** 목록 카드용: 연구과제(researchProjects) + 보고서(reports) → UI `report` 슬롯 합산 */
export function mapCountsToResultCounts(counts?: PriorResearchCounts) {
  return {
    report:
      toNumber(counts?.researchProjects) + toNumber(counts?.reports),
    paper: toNumber(counts?.papers),
    patent: toNumber(counts?.patents),
    article: toNumber(counts?.articlesBlogs),
    blog: 0 as number,
  }
}

export function mapPriorResearchResponseToSearchHistory(
  item: PriorResearchResponse,
  projectId: string,
  index: number
): SearchHistory {
  const counts = item.counts
  const rc = mapCountsToResultCounts(counts)
  const summed =
    rc.report + rc.paper + rc.patent + rc.article + (rc.blog ?? 0)
  const total = counts?.total !== undefined ? toNumber(counts.total) : summed

  return {
    id: item.id?.trim() || `prior-research-${projectId}-${index}-${item.createdAt}`,
    projectId,
    keyword: item.title,
    createdAt: item.createdAt,
    source: item.isAuto === false ? "manual" : "auto",
    topicDeleted: item.topicDeleted ?? false,
    resultCounts: rc,
    totalCount: total,
  }
}

export function mapPriorResearchItemToSearchResult(
  item: PriorResearchItem,
  type: DocumentType
): SearchResult {
  const metadata = item.metadata
  const raw = metadata?.raw
  const authors = uniqueStrings([
    ...splitAuthors(raw?.mainAuthor),
    ...splitAuthors(raw?.author),
  ])
  const organization =
    raw?.organization ??
    raw?.principalInvestigatorAffiliation ??
    (raw?.applicants?.trim() || undefined) ??
    raw?.journal_name ??
    raw?.journal ??
    undefined
  const keywords = uniqueStrings([
    ...splitKeywords(raw?.keywordsKo),
    ...splitKeywords(raw?.keywordsEn),
    ...splitKeywords(raw?.keyword),
    ...(metadata?.fieldTags ?? []),
    ...(metadata?.methodTags ?? []),
    ...(metadata?.dataTags ?? []),
  ])
  const abstractFromRaw = stripHtml(raw?.abstract) || raw?.summary?.trim()
  const normalizedContent = item.content?.trim()
  const content =
    normalizedContent && normalizedContent !== item.title?.trim()
      ? normalizedContent
      : undefined
  const abstract =
    abstractFromRaw ||
    content ||
    item.title?.trim() ||
    "요약 정보가 없습니다."
  const url =
    type === "patent"
      ? firstNonEmptyUrl(
          raw?.content_url,
          metadata?.url,
          raw?.fulltext_url,
          raw?.url
        )
      : firstNonEmptyUrl(
          metadata?.url,
          raw?.fulltext_url,
          raw?.content_url,
          raw?.url
        )
  const doi = normalizeDoi(raw?.doi)
  const doiUrl = buildDoiUrl(raw?.doi)

  return {
    id: item.id,
    type,
    title: item.title?.trim() || "제목 없음",
    authors,
    organization,
    publishedAt: buildPublishedAt(metadata, type),
    abstract,
    keywords,
    url,
    doi,
    doiUrl,
    similarity: normalizeSimilarity(item.score),
  }
}

export function mapPriorResearchDetailToSearchResults(
  detail?: PriorResearchDetail | null
): SearchResult[] {
  if (!detail) return []

  return [
    ...(detail.researchProjects ?? []).map((row) =>
      mapPriorResearchItemToSearchResult(row, "report")
    ),
    ...(detail.papers ?? []).map((row) =>
      mapPriorResearchItemToSearchResult(row, "paper")
    ),
    ...(detail.patents ?? []).map((row) =>
      mapPriorResearchItemToSearchResult(row, "patent")
    ),
    ...(detail.reports ?? []).map((row) =>
      mapPriorResearchItemToSearchResult(row, "report")
    ),
    ...(detail.articlesBlogs ?? []).map((row) =>
      mapPriorResearchItemToSearchResult(row, "article")
    ),
  ]
}
