import { useQuery } from "@tanstack/react-query"
import { API_BASE } from "@/shared/config/api"
import type { Notice } from "./notice"
import type { BaseResponse, NoticeAnalysisData } from "./notice-analysis-api"
import { mapNoticeAnalysisToNotice } from "./notice-analysis-api"

/** GET /api/v2/projects/{project_id}/notice/analysis (OpenAPI: BaseResponse_NoticeAnalysisData_) */
export function useNoticeAnalysis(projectId: string | undefined) {
  return useQuery({
    queryKey: ["noticeAnalysis", projectId],
    queryFn: async () => {
      if (!projectId) throw new Error("Project ID required")
      const res = await fetch(
        `${API_BASE}/api/v2/projects/${projectId}/notice/analysis`
      )
      let json: BaseResponse<NoticeAnalysisData>
      try {
        json = (await res.json()) as BaseResponse<NoticeAnalysisData>
      } catch {
        throw new Error(`공고 분석 조회 실패 (${res.status})`)
      }
      if (!res.ok) {
        const msg = (json as { message?: string }).message
        throw new Error(
          typeof msg === "string" && msg.trim() ? msg : `공고 분석 조회 실패 (${res.status})`
        )
      }
      if (!json.success || json.data == null) {
        throw new Error("공고 분석 데이터가 없습니다")
      }
      return mapNoticeAnalysisToNotice(json.data) as Notice
    },
    enabled: !!projectId,
  })
}
