export type DocumentType = "report" | "paper" | "patent" | "article" | "blog"

export type SearchSource = "auto" | "manual"

export interface SearchResult {
  id: string
  type: DocumentType
  title: string
  authors: string[]
  organization?: string
  publishedAt: string
  abstract: string
  keywords: string[]
  url?: string
  doi?: string
  doiUrl?: string
  similarity: number
}

export interface SearchHistory {
  id: string
  projectId?: string
  keyword: string
  createdAt: string
  source: SearchSource
  topicDeleted?: boolean
  /** API `PriorResearchCounts.total` (있으면 목록 카드 전체 건수에 우선 사용) */
  totalCount?: number
  resultCounts: {
    report: number
    paper: number
    patent: number
    article: number
    blog?: number
  }
}

export interface BookmarkItem extends SearchResult {
  bookmarkedAt: string
  memo?: string
}

export type ViewMode = "history" | "detail"

export type ResultViewType = "card" | "table"
