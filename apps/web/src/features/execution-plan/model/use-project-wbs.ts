"use client"

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { API_BASE } from "@/shared/config/api"

import {
  mapWbsToGanttTasks,
  mapWbsToMilestones,
  isWbsEmpty,
} from "@/features/execution-plan/model/map-wbs-to-view"
import type {
  BaseResponseWbs,
  WbsGenerateResponseData,
} from "@/features/execution-plan/model/wbs-api-types"

export const wbsQueryKey = (projectId: string) =>
  ["project", "wbs", "v2", projectId] as const

async function fetchProjectWbs(
  projectId: string
): Promise<WbsGenerateResponseData | null> {
  const res = await fetch(
    `${API_BASE}/api/v2/projects/${encodeURIComponent(projectId)}/wbs`
  )
  let json: BaseResponseWbs
  try {
    json = (await res.json()) as BaseResponseWbs
  } catch {
    throw new Error(`실행계획 조회 실패 (${res.status})`)
  }
  if (!res.ok) {
    const msg = json.message?.trim()
    throw new Error(msg || `실행계획 조회 실패 (${res.status})`)
  }
  if (!json.success) {
    throw new Error(json.message?.trim() || "실행계획을 불러오지 못했습니다")
  }
  return json.data
}

async function postGenerateWbs(
  projectId: string
): Promise<WbsGenerateResponseData> {
  const res = await fetch(
    `${API_BASE}/api/v2/projects/${encodeURIComponent(projectId)}/wbs/generate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }
  )
  let json: BaseResponseWbs
  try {
    json = (await res.json()) as BaseResponseWbs
  } catch {
    throw new Error(`실행계획 생성 실패 (${res.status})`)
  }
  if (!res.ok) {
    const msg = json.message?.trim()
    throw new Error(msg || `실행계획 생성 실패 (${res.status})`)
  }
  if (!json.success || !json.data) {
    throw new Error(json.message?.trim() || "실행계획 생성에 실패했습니다")
  }
  return json.data
}

export function useProjectWbs(projectId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: projectId ? wbsQueryKey(projectId) : ["project", "wbs", "v2", ""],
    queryFn: async () => {
      if (!projectId) throw new Error("프로젝트 ID가 필요합니다")
      return fetchProjectWbs(projectId)
    },
    enabled: !!projectId,
  })

  const generate = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error("프로젝트 ID가 필요합니다")
      return postGenerateWbs(projectId)
    },
    onSuccess: (data) => {
      if (projectId) {
        queryClient.setQueryData(wbsQueryKey(projectId), data)
      }
    },
  })

  const raw = query.data ?? null
  const empty = isWbsEmpty(raw)
  const ganttTasks = raw && !empty ? mapWbsToGanttTasks(raw) : []
  const milestones = raw && !empty ? mapWbsToMilestones(raw) : []

  return {
    query,
    generate,
    raw,
    empty,
    ganttTasks,
    milestones,
  }
}
