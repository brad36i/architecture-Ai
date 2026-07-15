import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { API_BASE } from "@/shared/config/api"

import type { BaseResponse } from "./differentiation-review-api"
import {
  mapApiToDifferentiationReviewData,
  parseDifferentiationReviewGet,
} from "./differentiation-review-api"
import type { DifferentiationReviewData } from "./types"

const queryKey = (projectId: string) => ["differentiationReview", "v2", projectId] as const

export function useDifferentiationReview(projectId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: projectId ? queryKey(projectId) : ["differentiationReview", "v2", ""],
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트 ID가 필요합니다")
      console.info("[differentiation][query][start]", {
        projectId,
        method: "GET",
      })
      const res = await fetch(
        `${API_BASE}/api/v2/projects/${encodeURIComponent(projectId)}/differentiation/review`
      )
      console.info("[differentiation][query][response]", {
        projectId,
        status: res.status,
        ok: res.ok,
      })
      let json: BaseResponse<unknown>
      try {
        json = (await res.json()) as BaseResponse<unknown>
      } catch {
        console.error("[differentiation][query][parse-error]", {
          projectId,
          status: res.status,
        })
        throw new Error(`차별성 검토 조회 실패 (${res.status})`)
      }
      if (!res.ok) {
        const msg = (json as { message?: string }).message
        console.error("[differentiation][query][http-error]", {
          projectId,
          status: res.status,
          message: msg,
        })
        throw new Error(
          typeof msg === "string" && msg.trim()
            ? msg
            : `차별성 검토 조회 실패 (${res.status})`
        )
      }
      if (!json.success) {
        const msg = (json as { message?: string }).message
        console.error("[differentiation][query][api-error]", {
          projectId,
          message: msg,
        })
        throw new Error(
          typeof msg === "string" && msg.trim()
            ? msg
            : "차별성 검토 조회에 실패했습니다"
        )
      }
      return parseDifferentiationReviewGet(json, projectId)
    },
    enabled: !!projectId,
  })

  const runReview = useMutation({
    mutationFn: async (): Promise<DifferentiationReviewData> => {
      if (!projectId) throw new Error("프로젝트 ID가 필요합니다")
      console.info("[differentiation][mutation][start]", {
        projectId,
        method: "POST",
      })
      const res = await fetch(
        `${API_BASE}/api/v2/projects/${encodeURIComponent(projectId)}/differentiation/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      )
      console.info("[differentiation][mutation][response]", {
        projectId,
        status: res.status,
        ok: res.ok,
      })
      let json: BaseResponse<unknown>
      try {
        json = (await res.json()) as BaseResponse<unknown>
      } catch {
        console.error("[differentiation][mutation][parse-error]", {
          projectId,
          status: res.status,
        })
        throw new Error(`차별성 검토 실행 실패 (${res.status})`)
      }
      if (!res.ok) {
        const msg = (json as { message?: string }).message
        console.error("[differentiation][mutation][http-error]", {
          projectId,
          status: res.status,
          message: msg,
        })
        throw new Error(
          typeof msg === "string" && msg.trim()
            ? msg
            : `차별성 검토 실행 실패 (${res.status})`
        )
      }
      if (!json.success || json.data == null) {
        const msg = (json as { message?: string }).message
        console.error("[differentiation][mutation][api-error]", {
          projectId,
          message: msg,
        })
        throw new Error(
          typeof msg === "string" && msg.trim()
            ? msg
            : "차별성 검토 응답이 올바르지 않습니다"
        )
      }
      const mapped = mapApiToDifferentiationReviewData(json.data, projectId)
      if (!mapped) {
        console.error("[differentiation][mutation][invalid-payload]", {
          projectId,
        })
        throw new Error("차별성 검토 응답 형식이 올바르지 않습니다")
      }
      return mapped
    },
    onSuccess: () => {
      console.info("[differentiation][mutation][success]", {
        projectId,
      })
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKey(projectId) })
      }
    },
    onError: (error) => {
      console.error("[differentiation][mutation][error]", {
        projectId,
        error,
      })
    },
  })

  return { query, runReview }
}
