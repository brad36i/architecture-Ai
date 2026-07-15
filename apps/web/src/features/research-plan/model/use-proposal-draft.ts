"use client"

import { useQuery } from "@tanstack/react-query"
import { API_BASE } from "@/shared/config/api"

interface BaseResponse<T> {
  success: boolean
  statusCode: number
  data: T | null
}

export interface ProposalDraftResponse {
  proposalContent: string
  hashlinedContent: string
  proposalFormat: string | null
  proposalVersion: number
}

export const proposalDraftQueryKey = (projectId: string, sessionId: number) =>
  ["proposalDraft", projectId, sessionId] as const

export function useProposalDraft(
  projectId: string,
  sessionId: number
) {
  return useQuery({
    queryKey: proposalDraftQueryKey(projectId, sessionId),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams()
      params.set("session_id", String(sessionId))

      const res = await fetch(
        `${API_BASE}/api/v2/projects/${projectId}/proposals?${params.toString()}`,
        { signal }
      )

      if (!res.ok) {
        throw new Error("건축 제안서 초안을 불러오지 못했습니다.")
      }

      const json = (await res.json()) as BaseResponse<ProposalDraftResponse>

      if (!json.success || !json.data) {
        throw new Error("건축 제안서 초안 응답이 올바르지 않습니다.")
      }

      return json.data
    },
    enabled: Boolean(projectId) && Number.isFinite(sessionId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}
