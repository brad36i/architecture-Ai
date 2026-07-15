import { useQuery } from "@tanstack/react-query"
import { API_BASE } from "@/shared/config/api"
import type { Attachment } from "./types"

/** OpenAPI `ProjectFileItemV2` */
export interface ProjectFileItemV2 {
  fileId: string
  fileName: string
  fileFormat?: string
  fileSize?: number
  success?: boolean
  baseUrl?: string
  originalKey?: string
  pdfKey?: string
  mdKey?: string
  htmlKey?: string
  error?: string | null
  tag?: string
  presignedOriginalUrl?: string | null
  presignedPdfUrl?: string | null
  presignedMdUrl?: string | null
  presignedHtmlUrl?: string | null
}

interface BaseResponse<T> {
  success: boolean
  statusCode: number
  data: T | null
}

/** 스토리지는 서명 URL만 허용하므로 뷰어는 `presignedPdfUrl`만 사용 */
function resolvePdfViewerUrl(file: ProjectFileItemV2): string | null {
  if (file.success === false) return null
  const presigned = file.presignedPdfUrl?.trim()
  return presigned || null
}

function resolveAttachmentExtension(file: ProjectFileItemV2): string | null {
  const [, inferredExtension = ""] = file.fileName.trim().match(/\.([^.]+)$/) ?? []
  return inferredExtension ? inferredExtension.toLowerCase() : null
}

function mapFileToAttachment(file: ProjectFileItemV2): Attachment {
  const pdfViewerUrl = resolvePdfViewerUrl(file)
  const formatTrimmed = file.fileFormat?.trim()
  const size =
    file.fileSize !== undefined && file.fileSize !== null && Number.isFinite(file.fileSize)
      ? file.fileSize
      : null

  return {
    id: file.fileId,
    title: file.fileName,
    extension: resolveAttachmentExtension(file),
    fileFormat: formatTrimmed || null,
    fileSize: size,
    pdfViewerUrl,
  }
}

export function useProjectFiles(projectId: string | undefined) {
  return useQuery({
    queryKey: ["projectFiles", "notice", projectId],
    queryFn: async () => {
      if (!projectId) throw new Error("Project ID required")
      const res = await fetch(
        `${API_BASE}/api/v2/projects/${projectId}/files/notice`
      )
      if (!res.ok) throw new Error("Failed to fetch project files")
      const json = (await res.json()) as BaseResponse<ProjectFileItemV2[]>
      if (!json.success || !json.data) return [] as Attachment[]
      return json.data.map((f) => mapFileToAttachment(f))
    },
    enabled: !!projectId,
  })
}
