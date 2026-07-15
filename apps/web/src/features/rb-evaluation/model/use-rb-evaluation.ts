"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { API_BASE } from "@/shared/config/api"

import {
  type BaseResponse,
  type RBEvaluationQueryState,
  type RBEvaluationResponse,
  mapApiToRBEvaluationResponse,
  parseRBEvaluationGet,
} from "./api-types"

const rbEvaluationQueryKey = (projectId: string) =>
  ["rbEvaluation", "v2", projectId] as const

function extractErrorMessage(json: unknown, fallback: string) {
  if (!json || typeof json !== "object") return fallback

  const payload = json as { message?: unknown }
  return typeof payload.message === "string" && payload.message.trim()
    ? payload.message
    : fallback
}

export function useRbEvaluation(projectId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: projectId ? rbEvaluationQueryKey(projectId) : ["rbEvaluation", "v2", ""],
    queryFn: async ({ signal }) => {
      if (!projectId) throw new Error("프로젝트 ID가 필요합니다")

      const res = await fetch(
        `${API_BASE}/api/v2/projects/${encodeURIComponent(projectId)}/rb/evaluation`,
        { signal }
      )

      let json: BaseResponse<unknown>
      try {
        json = (await res.json()) as BaseResponse<unknown>
      } catch {
        throw new Error(`전문기관 평가의견 조회 실패 (${res.status})`)
      }

      if (!res.ok) {
        throw new Error(extractErrorMessage(json, `전문기관 평가의견 조회 실패 (${res.status})`))
      }

      if (!json.success) {
        throw new Error(extractErrorMessage(json, "전문기관 평가의견 조회에 실패했습니다"))
      }

      return parseRBEvaluationGet(json, projectId)
    },
    enabled: !!projectId,
  })

  const runEvaluation = useMutation({
    mutationFn: async (): Promise<RBEvaluationResponse> => {
      if (!projectId) throw new Error("프로젝트 ID가 필요합니다")

      const res = await fetch(
        `${API_BASE}/api/v2/projects/${encodeURIComponent(projectId)}/rb/evaluation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topK: 10 }),
        }
      )

      let json: BaseResponse<unknown>
      try {
        json = (await res.json()) as BaseResponse<unknown>
      } catch {
        throw new Error(`건축 제안서 평가 실행 실패 (${res.status})`)
      }

      if (!res.ok) {
        throw new Error(extractErrorMessage(json, `건축 제안서 평가 실행 실패 (${res.status})`))
      }

      if (!json.success || json.data == null) {
        throw new Error(extractErrorMessage(json, "건축 제안서 평가 응답이 올바르지 않습니다"))
      }

      const mapped = mapApiToRBEvaluationResponse(json.data, projectId)
      if (!mapped) {
        throw new Error("건축 제안서 평가 응답 형식이 올바르지 않습니다")
      }

      return mapped
    },
    onSuccess: (data) => {
      if (!projectId) return

      const nextState: RBEvaluationQueryState = {
        kind: "evaluation",
        data,
      }

      queryClient.setQueryData(rbEvaluationQueryKey(projectId), nextState)
    },
  })

  return { query, runEvaluation }
}
