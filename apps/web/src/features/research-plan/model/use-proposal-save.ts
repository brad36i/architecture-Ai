"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { API_BASE } from "@/shared/config/api"

import { proposalDraftQueryKey } from "./use-proposal-draft"

interface BaseResponse<T> {
  success: boolean
  statusCode: number
  data: T | null
  message?: string
}

export interface ProposalSaveParams {
  proposalContent: string
  baseVersion?: number | null
}

export interface ProposalSaveResponse {
  proposalVersion: number
  message?: string
}

export function useProposalSave(projectId: string, sessionId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      proposalContent,
      baseVersion,
    }: ProposalSaveParams): Promise<ProposalSaveResponse> => {
      if (!projectId) throw new Error("프로젝트 ID가 필요합니다.")

      const params = new URLSearchParams()
      params.set("session_id", String(sessionId))

      const res = await fetch(
        `${API_BASE}/api/v2/projects/${encodeURIComponent(projectId)}/proposals?${params.toString()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proposalContent,
            ...(baseVersion != null ? { baseVersion } : {}),
          }),
        }
      )

      let json: BaseResponse<ProposalSaveResponse>
      try {
        json = (await res.json()) as BaseResponse<ProposalSaveResponse>
      } catch {
        throw new Error(`건축 제안서 저장 실패 (${res.status})`)
      }

      if (!res.ok) {
        throw new Error(
          typeof json.message === "string" && json.message.trim()
            ? json.message
            : `건축 제안서 저장 실패 (${res.status})`
        )
      }

      if (!json.success || !json.data) {
        throw new Error(
          typeof json.message === "string" && json.message.trim()
            ? json.message
            : "건축 제안서 저장 응답이 올바르지 않습니다."
        )
      }

      return json.data
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        proposalDraftQueryKey(projectId, sessionId),
        (prev:
          | {
              proposalContent: string
              hashlinedContent: string | null
              proposalFormat: string | null
              proposalVersion: number
            }
          | undefined) => ({
          proposalContent: variables.proposalContent,
          hashlinedContent: prev?.hashlinedContent ?? null,
          proposalFormat: prev?.proposalFormat ?? null,
          proposalVersion: data.proposalVersion,
        })
      )
    },
  })
}
