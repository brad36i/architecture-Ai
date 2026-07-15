"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { API_BASE } from "@/shared/config/api"

import {
  type BaseResponse,
  type TechClassificationQueryState,
  type TechClassificationResponse,
  mapApiToTechClassificationResponse,
  parseTechClassificationGet,
} from "./api-types"

const techClassificationQueryKey = (projectId: string) =>
  ["techClassification", "v2", projectId] as const

function extractErrorMessage(json: unknown, fallback: string) {
  if (!json || typeof json !== "object") return fallback

  const payload = json as { message?: unknown }
  return typeof payload.message === "string" && payload.message.trim()
    ? payload.message
    : fallback
}

export function useTechClassification(projectId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: projectId
      ? techClassificationQueryKey(projectId)
      : ["techClassification", "v2", ""],
    queryFn: async ({ signal }) => {
      if (!projectId) throw new Error("프로젝트 ID가 필요합니다")

      const res = await fetch(
        `${API_BASE}/api/v2/projects/${encodeURIComponent(projectId)}/tech/classification`,
        { signal }
      )

      let json: BaseResponse<unknown>
      try {
        json = (await res.json()) as BaseResponse<unknown>
      } catch {
        throw new Error(`기술표준분류 조회 실패 (${res.status})`)
      }

      if (!res.ok) {
        throw new Error(extractErrorMessage(json, `기술표준분류 조회 실패 (${res.status})`))
      }

      if (!json.success) {
        throw new Error(extractErrorMessage(json, "기술표준분류 조회에 실패했습니다"))
      }

      return parseTechClassificationGet(json)
    },
    enabled: !!projectId,
  })

  const recommendClassification = useMutation({
    mutationFn: async (): Promise<TechClassificationResponse> => {
      if (!projectId) throw new Error("프로젝트 ID가 필요합니다")

      const res = await fetch(
        `${API_BASE}/api/v2/projects/${encodeURIComponent(projectId)}/tech/classification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topK: 3 }),
        }
      )

      let json: BaseResponse<unknown>
      try {
        json = (await res.json()) as BaseResponse<unknown>
      } catch {
        throw new Error(`기술표준분류 추천 실패 (${res.status})`)
      }

      if (!res.ok) {
        throw new Error(extractErrorMessage(json, `기술표준분류 추천 실패 (${res.status})`))
      }

      if (!json.success || json.data == null) {
        throw new Error(extractErrorMessage(json, "기술표준분류 추천 응답이 올바르지 않습니다"))
      }

      const mapped = mapApiToTechClassificationResponse(json.data)
      if (!mapped || mapped.groupedRecommendations.length === 0) {
        throw new Error("기술표준분류 추천 결과가 비어 있습니다")
      }

      return mapped
    },
    onSuccess: (data) => {
      if (!projectId) return

      const nextState: TechClassificationQueryState = {
        kind: "classification",
        data,
      }

      queryClient.setQueryData(techClassificationQueryKey(projectId), nextState)
    },
  })

  return { query, recommendClassification }
}
