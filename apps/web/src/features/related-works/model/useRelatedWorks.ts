import { useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { API_BASE } from "@/shared/config/api"
import type { SearchHistory, SearchResult, DocumentType } from "./types"
import {
  mapPriorResearchDetailToSearchResults,
  mapPriorResearchResponseToSearchHistory,
  type PriorResearchAddRequest,
  type PriorResearchDeleteApiResponse,
  type PriorResearchDetailApiResponse,
  type PriorResearchListApiResponse,
  type PriorResearchSingleApiResponse,
} from "./prior-research-api"

export async function fetchPriorResearchDetailResults(
  projectId: string,
  researchId: string
): Promise<SearchResult[]> {
  const encodedResearchId = encodeURIComponent(researchId)
  const res = await fetch(
    `${API_BASE}/api/v2/projects/${projectId}/prior/research/${encodedResearchId}`
  )
  let json: PriorResearchDetailApiResponse
  try {
    json = (await res.json()) as PriorResearchDetailApiResponse
  } catch {
    throw new Error(`선행연구 상세 조회 실패 (${res.status})`)
  }
  if (!res.ok) {
    const msg = (json as { message?: string }).message
    throw new Error(
      typeof msg === "string" && msg.trim()
        ? msg
        : `선행연구 상세 조회 실패 (${res.status})`
    )
  }
  if (!json.success || json.data == null) return [] as SearchResult[]
  return mapPriorResearchDetailToSearchResults(json.data.detail)
}

/** 목록에 없는 `researchId`여도 상세만 조회할 때 (토픽 노드 선행연구 패널 등) */
export function usePriorResearchDetailQuery(
  projectId: string,
  researchId: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const enabled =
    !!projectId &&
    !!researchId &&
    (options?.enabled ?? true)

  return useQuery({
    queryKey: ["relatedWorksResults", "v2", projectId, researchId ?? ""],
    queryFn: () => fetchPriorResearchDetailResults(projectId, researchId!),
    enabled,
  })
}

export function useRelatedWorks(projectId: string, historyId?: string | null) {
  const {
    data: histories = [],
    isFetched: priorListFetched,
    isPending: priorListPending,
  } = useQuery({
    queryKey: ["relatedWorksHistories", "v2", projectId],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/api/v2/projects/${projectId}/prior/research`
      )
      let json: PriorResearchListApiResponse
      try {
        json = (await res.json()) as PriorResearchListApiResponse
      } catch {
        throw new Error(`선행연구 목록 조회 실패 (${res.status})`)
      }
      if (!res.ok) {
        const msg = (json as { message?: string }).message
        throw new Error(
          typeof msg === "string" && msg.trim()
            ? msg
            : `선행연구 목록 조회 실패 (${res.status})`
        )
      }
      if (!json.success || !json.data) return [] as SearchHistory[]
      return json.data.map((item, index) =>
        mapPriorResearchResponseToSearchHistory(item, projectId, index)
      )
    },
    enabled: !!projectId,
  })

  const selectedHistory = useMemo(
    () => histories.find((h) => h.id === historyId) ?? null,
    [histories, historyId]
  )

  const canFetchDetail =
    !!projectId &&
    !!historyId &&
    priorListFetched &&
    histories.some((h) => h.id === historyId)

  const { data: results = [] } = useQuery({
    queryKey: ["relatedWorksResults", "v2", projectId, historyId],
    queryFn: () => fetchPriorResearchDetailResults(projectId, historyId!),
    enabled: canFetchDetail,
  })

  const resultsByType = useMemo(() => {
    const groups: Record<DocumentType, SearchResult[]> = {
      report: [],
      paper: [],
      patent: [],
      article: [],
      blog: [],
    }
    results.forEach((result) => {
      groups[result.type].push(result)
    })
    return groups
  }, [results])

  return {
    histories,
    selectedHistory,
    results,
    resultsByType,
    isPriorListPending: priorListPending,
    isPriorListFetched: priorListFetched,
  }
}

export function useCreatePriorResearch(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (content: string) => {
      const body: PriorResearchAddRequest = { content: content.trim() }
      const res = await fetch(
        `${API_BASE}/api/v2/projects/${projectId}/prior/research`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      )
      let json: PriorResearchSingleApiResponse
      try {
        json = (await res.json()) as PriorResearchSingleApiResponse
      } catch {
        throw new Error(`선행연구 추가 실패 (${res.status})`)
      }
      if (!res.ok) {
        const msg = (json as { message?: string }).message
        throw new Error(
          typeof msg === "string" && msg.trim()
            ? msg
            : `선행연구 추가 실패 (${res.status})`
        )
      }
      if (!json.success || json.data == null) {
        throw new Error("선행연구 추가 응답이 올바르지 않습니다")
      }
      return mapPriorResearchResponseToSearchHistory(json.data, projectId, 0)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["relatedWorksHistories", "v2", projectId],
      })
    },
  })
}

export function useDeletePriorResearch(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (researchId: string) => {
      const encodedId = encodeURIComponent(researchId)
      const res = await fetch(
        `${API_BASE}/api/v2/projects/${projectId}/prior/research/${encodedId}`,
        { method: "DELETE" }
      )
      let json: PriorResearchDeleteApiResponse
      try {
        json = (await res.json()) as PriorResearchDeleteApiResponse
      } catch {
        throw new Error(`선행연구 삭제 실패 (${res.status})`)
      }
      if (!res.ok) {
        const msg = (json as { message?: string }).message
        throw new Error(
          typeof msg === "string" && msg.trim()
            ? msg
            : `선행연구 삭제 실패 (${res.status})`
        )
      }
      if (!json.success || json.data == null) {
        throw new Error("선행연구 삭제 응답이 올바르지 않습니다")
      }
      if (json.data.researchId !== researchId) {
        console.warn(
          "[prior/research DELETE] researchId mismatch",
          json.data.researchId,
          researchId
        )
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["relatedWorksHistories", "v2", projectId],
      })
      queryClient.invalidateQueries({
        queryKey: ["relatedWorksResults", "v2", projectId],
      })
    },
  })
}
