"use client"

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { API_BASE } from "@/shared/config/api"

/** GET/POST/PATCH 응답 — OpenAPI ClippingResponse */
export interface ClippingResponse {
  id: string
  projectId: string
  content: string
  clippingType: string
  sourceAgent?: string | null
  sourceSessionId?: string | null
  createdAt: string
  updatedAt: string
  /** 구버전/확장 필드 (있으면 표시용) */
  title?: string | null
  memo?: string | null
}

export interface ClippingListResponse {
  clippings: ClippingResponse[]
  total: number
}

export type ClippingSourceAgent =
  | "topic_selection"
  | "topic_refinement"
  | "prior_research"
  | "proposal"
  | "diagram_suggestion"
  | "differentiation_review"
  | "tech_classification"
  | "rb_evaluation"
  | "execution"

/** PATCH 요청 (OpenAPI ClippingUpdateRequest) */
export interface ClippingUpdateRequest {
  content?: string | null
  clippingType?: string | null
  sourceAgent?: ClippingSourceAgent | string | null
  sourceSessionId?: string | null
}

/** POST create 요청 (OpenAPI ClippingCreateRequest) */
export interface ClippingCreateRequest {
  content: string
  clippingType?: string
  sourceAgent?: ClippingSourceAgent | string | null
  sourceSessionId?: string | null
}

export interface ListClippingsParams {
  clippingType?: string
  sourceAgent?: string
  sort?: string
  limit?: number
  offset?: number
}

interface BaseResponse<T> {
  success: boolean
  statusCode?: number
  data: T | null
}

const QUERY_KEY = ["clippings"] as const

function buildListQuery(params?: ListClippingsParams) {
  const sp = new URLSearchParams()
  if (params?.clippingType) sp.set("clipping_type", params.clippingType)
  if (params?.sourceAgent) sp.set("source_agent", params.sourceAgent)
  if (params?.sort) sp.set("sort", params.sort)
  if (params?.limit != null) sp.set("limit", String(params.limit))
  if (params?.offset != null) sp.set("offset", String(params.offset))
  const q = sp.toString()
  return q ? `?${q}` : ""
}

async function fetchClippings(
  projectId: string,
  listParams?: ListClippingsParams
): Promise<{ clippings: ClippingResponse[]; total: number }> {
  const defaultLimit = listParams?.limit ?? 100
  const qs = buildListQuery({ ...listParams, limit: defaultLimit })
  const res = await fetch(
    `${API_BASE}/api/v2/projects/${projectId}/clippings${qs}`
  )
  if (!res.ok) throw new Error("갈무리 목록을 불러오지 못했습니다")
  const json = (await res.json()) as BaseResponse<ClippingListResponse>
  if (!json.success || !json.data) {
    return { clippings: [], total: 0 }
  }
  return {
    clippings: json.data.clippings ?? [],
    total: json.data.total ?? 0,
  }
}

async function updateClipping(
  projectId: string,
  clippingId: string,
  body: ClippingUpdateRequest
): Promise<ClippingResponse> {
  const res = await fetch(
    `${API_BASE}/api/v2/projects/${projectId}/clippings/${clippingId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) throw new Error("갈무리 수정에 실패했습니다")
  const json = (await res.json()) as BaseResponse<ClippingResponse>
  if (!json.success || !json.data) throw new Error("수정 응답 오류")
  return json.data
}

async function createClipping(
  projectId: string,
  body: ClippingCreateRequest
): Promise<ClippingResponse> {
  const payload: Record<string, unknown> = {
    content: body.content,
    clippingType: body.clippingType ?? "text",
  }
  if (body.sourceAgent != null) payload.sourceAgent = body.sourceAgent
  if (body.sourceSessionId != null) payload.sourceSessionId = body.sourceSessionId

  const res = await fetch(
    `${API_BASE}/api/v2/projects/${projectId}/clippings`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  )
  if (!res.ok) throw new Error("갈무리 저장에 실패했습니다")
  const json = (await res.json()) as BaseResponse<ClippingResponse>
  if (!json.success || !json.data) throw new Error("저장 응답 오류")
  return json.data
}

async function deleteClipping(
  projectId: string,
  clippingId: string
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/v2/projects/${projectId}/clippings/${clippingId}`,
    { method: "DELETE" }
  )
  if (!res.ok) throw new Error("갈무리 삭제에 실패했습니다")
}

export function useClippings(
  projectId: string | undefined,
  listParams?: ListClippingsParams
) {
  const queryClient = useQueryClient()
  const queryKey = [...QUERY_KEY, projectId, listParams] as const

  const query = useQuery({
    queryKey,
    queryFn: () => fetchClippings(projectId!, listParams),
    enabled: !!projectId,
  })

  const invalidateClippings = () => {
    if (!projectId) return
    queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, projectId] })
  }

  const updateMutation = useMutation({
    mutationFn: ({
      clippingId,
      body,
    }: {
      clippingId: string
      body: ClippingUpdateRequest
    }) => updateClipping(projectId!, clippingId, body),
    onSuccess: invalidateClippings,
  })

  const deleteMutation = useMutation({
    mutationFn: (clippingId: string) => deleteClipping(projectId!, clippingId),
    onSuccess: invalidateClippings,
  })

  const createMutation = useMutation({
    mutationFn: (body: ClippingCreateRequest) =>
      createClipping(projectId!, body),
    onSuccess: invalidateClippings,
  })

  return {
    clippings: query.data?.clippings ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateClipping: updateMutation.mutateAsync,
    updatePending: updateMutation.isPending,
    deleteClipping: deleteMutation.mutateAsync,
    deletePending: deleteMutation.isPending,
    createClipping: createMutation.mutateAsync,
    createPending: createMutation.isPending,
  }
}

/** SearchResult를 ClippingCreateRequest로 변환 (선행연구·문헌 등) */
export function searchResultToClippingCreate(r: {
  title: string
  authors: string[]
  abstract: string
  type?: string
}): ClippingCreateRequest {
  const meta = [r.title, r.authors.join(", ")].filter(Boolean).join("\n")
  return {
    content: `${meta}\n\n${r.abstract}`.trim(),
    clippingType: "text",
    sourceAgent: "prior_research",
  }
}

/**
 * 다른 화면에서도 동일 POST를 쓰려면 `useClippings(projectId).createClipping` 또는
 * 이 함수를 사용하면 됩니다.
 */
export async function postProjectClipping(
  projectId: string,
  body: ClippingCreateRequest
): Promise<ClippingResponse> {
  return createClipping(projectId, body)
}
