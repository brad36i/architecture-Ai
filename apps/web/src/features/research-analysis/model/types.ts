export type Attachment = {
  id: string
  title: string
  extension: string | null
  /** API `fileFormat` (없으면 확장자 등으로 보조 표시) */
  fileFormat: string | null
  /** 바이트 단위, API `fileSize` */
  fileSize: number | null
  /** PDF 뷰어(iframe) — API `presignedPdfUrl`만 사용 (비서명 URL은 스토리지에서 거절됨) */
  pdfViewerUrl: string | null
}

export type ResearchAnalysis = {
  id: string
  projectId: string
  summary: string
  guidelines: string
  attachments: Attachment[]
}
