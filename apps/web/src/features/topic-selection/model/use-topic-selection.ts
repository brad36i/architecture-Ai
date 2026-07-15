"use client"

import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Edge, Node } from "@xyflow/react"

import { API_BASE } from "@/shared/config/api"

import {
  INPUT_NODE_X,
  INPUT_NODE_Y,
  NODE_OFFSET_X,
  NODE_OFFSET_Y,
} from "./types"
import { mapBackendTopicToTopicContent } from "./use-topic-selection-start-stream"

export interface TopicSelectionState {
  id: string
  projectId: string
  nodes: Node[]
  edges: Edge[]
  nodeIdRef: number
}

interface TopicItem {
  id: string
  /** 서버가 병합 노드일 때 "id1,id2"처럼 콤마 구분 다중 부모를 줄 수 있음 */
  parentNodeId?: string | null
  label: string
  title: string
  overview?: string
  content: string
  keywords?: string[]
  detail: string
  depth?: number
  isLastNode?: boolean
  view?: boolean
  goalText?: string | null
  researchContent?: string | null
  expectedEffectAndPlan?: string | null
}

interface TopicNodeListResponse {
  nodes: TopicItem[]
  /** 루트 응답 title (있으면 프롬프트 보조). 우선순위: nodes 중 depth===0 의 title > 이 필드 */
  title?: string | null
}

interface TopicNodesDeleteResponse {
  deletedCount: number
}

const initialNodes: Node[] = [
  {
    id: "input-1",
    type: "prompt",
    position: { x: 140, y: 280 },
    data: { label: "입력" },
  },
]

/** 프롬프트 노드 — 토픽의 루트 부모 id (API가 자식의 parent를 여기로 잘못 줄 때 로컬/엣지로 보정할 때 사용) */
export const TOPIC_PROMPT_NODE_ID = initialNodes[0].id

export const defaultState: Omit<TopicSelectionState, "id" | "projectId"> = {
  nodes: initialNodes,
  edges: [],
  nodeIdRef: 1,
}

const TEMP_TOPIC_NODE_ID_PATTERN = /^topic-\d+$/

/** 로컬 플레이스홀더 `topic-N` id 생성 시 다음 N (서버 스냅샷과 병합할 때도 사용) */
export function computeNextNodeIdRef(nodes: Node[]) {
  return (
    nodes.reduce((max, node) => {
      const match = TEMP_TOPIC_NODE_ID_PATTERN.exec(node.id)
      if (!match) return max
      return Math.max(max, Number(match[0].slice("topic-".length)))
    }, 0) + 1
  )
}

async function readApiData<T>(res: Response): Promise<T> {
  const json = (await res.json().catch(() => null)) as
    | { data?: T; success?: boolean }
    | T
    | null

  if (!res.ok) {
    throw new Error(`API 오류: ${res.status}`)
  }

  if (json && typeof json === "object" && "data" in json) {
    return (json.data ?? null) as T
  }

  return json as T
}

function sortTopicSiblingsStable(group: TopicItem[]) {
  group.sort((a, b) => {
    const da = typeof a.depth === "number" ? a.depth : Number.POSITIVE_INFINITY
    const db = typeof b.depth === "number" ? b.depth : Number.POSITIVE_INFINITY
    if (da !== db) return da - db
    return 0
  })
}

function splitParentNodeIds(raw: string | null | undefined): string[] {
  if (typeof raw !== "string") return []
  return [...new Set(raw.split(",").map((id) => id.trim()).filter(Boolean))]
}

/** API가 내려주는 depth===0 루트(프롬프트 스냅샷) — 캔버스 토픽 노드로는 그리지 않고 textarea 초기값만 채움 */
function pickDepthZeroPromptSeed(items: TopicItem[]): string | undefined {
  const zeros = items.filter((i) => typeof i.depth === "number" && i.depth === 0)
  for (const z of zeros) {
    const t = z.title?.trim() || z.label?.trim()
    if (t) return t
  }
  return undefined
}

function buildTopicSelectionState(
  projectId: string,
  items: TopicItem[],
  promptSeed?: string | null
): TopicSelectionState {
  const depthZeroSeed = pickDepthZeroPromptSeed(items)
  const trimmedSeedFromParam =
    typeof promptSeed === "string" && promptSeed.trim() ? promptSeed.trim() : undefined
  const trimmedSeed = depthZeroSeed ?? trimmedSeedFromParam

  const basePrompt = initialNodes[0]
  const promptNode: Node = {
    ...basePrompt,
    data: {
      ...basePrompt.data,
      ...(trimmedSeed ? { initialPrompt: trimmedSeed } : {}),
    },
  }
  const visibleItems = items.filter(
    (item) =>
      item.view !== false && !(typeof item.depth === "number" && item.depth === 0)
  )
  const itemIds = new Set(visibleItems.map((item) => item.id))
  const normalizedParentIds = new Map<string, string>()
  const normalizedParentIdLists = new Map<string, string[]>()
  const childrenByParent = new Map<string, TopicItem[]>()

  for (const item of visibleItems) {
    const requestedParentIds = splitParentNodeIds(item.parentNodeId)
    const validParentIds = requestedParentIds.filter((parentId) => itemIds.has(parentId))
    const parentIds = validParentIds.length > 0 ? validParentIds : [promptNode.id]
    const primaryParentId = parentIds[0]

    normalizedParentIds.set(item.id, primaryParentId)
    normalizedParentIdLists.set(item.id, parentIds)

    const group = childrenByParent.get(primaryParentId) ?? []
    group.push(item)
    childrenByParent.set(primaryParentId, group)
  }

  for (const [, group] of childrenByParent.entries()) {
    sortTopicSiblingsStable(group)
  }

  const positions = new Map<string, { x: number; y: number }>()
  const layoutDepthById = new Map<string, number>()

  const resolveDepth = (item: TopicItem, fallbackDepth: number) =>
    typeof item.depth === "number" && item.depth > 0 ? item.depth : fallbackDepth

  const placeChildren = (parentId: string, parentY: number, parentDepth: number) => {
    const children = childrenByParent.get(parentId) ?? []

    children.forEach((child, index) => {
      const layoutDepth = resolveDepth(child, parentDepth + 1)
      const position = {
        x: INPUT_NODE_X + layoutDepth * NODE_OFFSET_X,
        y: parentY + (index - (children.length - 1) / 2) * NODE_OFFSET_Y,
      }

      layoutDepthById.set(child.id, layoutDepth)
      positions.set(child.id, position)
      placeChildren(child.id, position.y, layoutDepth)
    })
  }

  positions.set(promptNode.id, { x: INPUT_NODE_X, y: INPUT_NODE_Y })
  layoutDepthById.set(promptNode.id, 0)
  placeChildren(promptNode.id, INPUT_NODE_Y, 0)

  let fallbackIndex = 0
  for (const item of visibleItems) {
    if (positions.has(item.id)) continue
    const layoutDepth = resolveDepth(item, 1)
    layoutDepthById.set(item.id, layoutDepth)
    positions.set(item.id, {
      x: INPUT_NODE_X + layoutDepth * NODE_OFFSET_X,
      y: INPUT_NODE_Y + fallbackIndex * NODE_OFFSET_Y,
    })
    fallbackIndex += 1
  }

  const itemsByDepth = new Map<number, TopicItem[]>()
  for (const item of visibleItems) {
    const depth = layoutDepthById.get(item.id) ?? resolveDepth(item, 1)
    const group = itemsByDepth.get(depth) ?? []
    group.push(item)
    itemsByDepth.set(depth, group)
  }

  for (const [depth, group] of itemsByDepth.entries()) {
    const ordered = [...group].sort((left, right) => {
      const leftIsLast = Boolean(left.isLastNode || left.goalText || left.researchContent || left.expectedEffectAndPlan)
      const rightIsLast = Boolean(right.isLastNode || right.goalText || right.researchContent || right.expectedEffectAndPlan)
      if (leftIsLast !== rightIsLast) return leftIsLast ? 1 : -1
      return (positions.get(left.id)?.y ?? 0) - (positions.get(right.id)?.y ?? 0)
    })
    ordered.forEach((item, index) => {
      positions.set(item.id, {
        x: INPUT_NODE_X + depth * NODE_OFFSET_X,
        y: INPUT_NODE_Y + (index - (ordered.length - 1) / 2) * NODE_OFFSET_Y,
      })
    })
  }

  const nodes: Node[] = [
    promptNode,
    ...visibleItems.map((item) => {
      const position = positions.get(item.id) ?? { x: INPUT_NODE_X + NODE_OFFSET_X, y: INPUT_NODE_Y }
      const layoutDepth = layoutDepthById.get(item.id) ?? resolveDepth(item, 1)
      const parentNodeIds = normalizedParentIdLists.get(item.id) ?? [promptNode.id]
      const isMergedFromMultipleParents = parentNodeIds.length > 1
      const content = mapBackendTopicToTopicContent({
        id: item.id,
        label: item.label,
        title: item.title,
        overview: item.overview,
        content: item.content,
        detail: item.detail,
        keywords: item.keywords ?? [],
        depth: item.depth,
        parentNodeId: item.parentNodeId ?? null,
        isLastNode: item.isLastNode,
      })
      const hasSelectedContent = Boolean(
        item.goalText || item.researchContent || item.expectedEffectAndPlan
      )
      const isLastNode = Boolean(item.isLastNode) || hasSelectedContent

      return {
        id: item.id,
        type: "topic",
        position,
        data: {
          label: content.subject || item.title || item.detail,
          content,
          backendNodeId: item.id,
          keywords: item.keywords ?? [],
          checked: false,
          pinned: false,
          parentNodeId: normalizedParentIds.get(item.id) ?? promptNode.id,
          parentNodeIds,
          depth: typeof item.depth === "number" && item.depth > 0 ? item.depth : layoutDepth,
          tag: item.label || "연구확장",
          tags: [
            ...new Set([
              item.label || "연구확장",
              ...(isMergedFromMultipleParents ? ["연구합치기"] : []),
            ]),
          ],
          fromMerge: isMergedFromMultipleParents,
          isLoading: false,
          isLastNode,
          topicSelected: hasSelectedContent,
          selectedContent: hasSelectedContent
            ? {
                finalObjective: item.goalText ?? "",
                researchContent: item.researchContent ?? "",
                expectedEffectAndPlan: item.expectedEffectAndPlan ?? "",
              }
            : undefined,
        },
      } satisfies Node
    }),
  ]

  const edges: Edge[] = visibleItems.flatMap((item) => {
    const sourceIds = normalizedParentIdLists.get(item.id) ?? [promptNode.id]

    return sourceIds.map((sourceId) => ({
      id: `edge-${sourceId}-${item.id}`,
      source: sourceId,
      target: item.id,
    }))
  })

  return {
    id: projectId,
    projectId,
    nodes,
    edges,
    nodeIdRef: computeNextNodeIdRef(nodes),
  }
}

export function useTopicSelection(projectId: string) {
  const queryClient = useQueryClient()

  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["topicSelection", projectId],
    queryFn: async ({ signal }): Promise<TopicSelectionState | null> => {
      const res = await fetch(`${API_BASE}/api/v2/projects/${projectId}/topics/nodes`, {
        signal,
      })
      if (res.status === 404) {
        return {
          id: projectId,
          projectId,
          ...defaultState,
        }
      }

      const payload = await readApiData<TopicNodeListResponse>(res)
      const listNodes = payload?.nodes ?? []
      const depthZeroOnly = listNodes.filter(
        (n) => typeof n.depth === "number" && n.depth === 0
      )
      if (depthZeroOnly.length > 0) {
        console.info("[topic-selection] GET /topics/nodes depth===0", {
          projectId,
          nodes: depthZeroOnly,
        })
      }

      return buildTopicSelectionState(projectId, listNodes, payload?.title ?? null)
    },
    enabled: !!projectId,
  })

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/api/v2/projects/${projectId}/topics/nodes`, {
        method: "DELETE",
      })
      if (res.status === 404) {
        return { deletedCount: 0 } satisfies TopicNodesDeleteResponse
      }
      return readApiData<TopicNodesDeleteResponse>(res)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["topicSelection", projectId],
        refetchType: "all",
      })
    },
  })

  const deleteNodeMutation = useMutation({
    mutationFn: async (nodeId: string) => {
      const res = await fetch(`${API_BASE}/api/v2/projects/${projectId}/topics/nodes/${nodeId}`, {
        method: "DELETE",
      })
      if (res.status === 404) {
        return { deletedCount: 0 } satisfies TopicNodesDeleteResponse
      }
      return readApiData<TopicNodesDeleteResponse>(res)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["topicSelection", projectId],
        refetchType: "all",
      })
    },
  })

  const emptyState = useMemo(
    (): TopicSelectionState | null =>
      projectId
        ? {
            id: projectId,
            projectId,
            ...defaultState,
          }
        : null,
    [projectId]
  )

  const state: TopicSelectionState | null = data ?? emptyState

  return {
    state,
    /** 첫 페치 중에만 true — refetch 시에는 false라 전체 화면 로딩으로 캔버스를 비우지 않음 */
    isInitialLoad: Boolean(projectId) && isPending,
    isLoading: isPending,
    dataUpdatedAt,
    isError,
    error,
    refresh: () => refetch(),
    deleteAllNodes: () => deleteAllMutation.mutateAsync(),
    deleteNode: (nodeId: string) => deleteNodeMutation.mutateAsync(nodeId),
    isDeletingAll: deleteAllMutation.isPending,
    isDeletingNode: deleteNodeMutation.isPending,
  }
}
