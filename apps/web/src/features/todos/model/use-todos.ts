"use client"

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { API_BASE } from "@/shared/config/api"

/** GET /api/v2/projects/{project_id}/todos — data.items 항목 (OpenAPI SubmissionChecklistItemResponse) */
export interface TodoItemApi {
  projectId: string
  id: string
  type: string
  isChecked: boolean
  content: string
  groupPath: string[]
  required?: boolean | null
}

export interface TodoSummary {
  total: number
  completed: number
  pending: number
  inProgress: number
  completionRate: number
}

interface TodoListData {
  items: TodoItemApi[]
}

/** POST /api/v2/projects/{project_id}/todos */
export interface TodoCreateRequest {
  content: string
  groupPath?: string[]
  required?: boolean
  isChecked?: boolean
}

/** PATCH /api/v2/projects/{project_id}/todos/{todo_id} */
export interface TodoUpdateRequest {
  content?: string | null
  groupPath?: string[] | null
  required?: boolean | null
  isChecked?: boolean | null
}

/** GET /api/v2/projects/{project_id}/todos/progress (선택, 없으면 무시) */
export interface StepProgress {
  step: number
  label: string
  status: string
  agentCode?: string | null
  hasResult: boolean
}

export interface ResearchProgressResponse {
  currentStep: number
  currentStepLabel: string
  steps?: StepProgress[]
  overallCompletion?: number
}

interface BaseResponse<T> {
  success: boolean
  statusCode?: number
  data: T | null
}

function normalizeItem(raw: Record<string, unknown>): TodoItemApi {
  const groupPath = raw.groupPath
  return {
    projectId: String(raw.projectId ?? ""),
    id: String(raw.id ?? ""),
    type: String(raw.type ?? "notice"),
    isChecked: Boolean(raw.isChecked),
    content: String(raw.content ?? ""),
    groupPath: Array.isArray(groupPath)
      ? groupPath.map((s) => String(s))
      : [],
    required:
      typeof raw.required === "boolean"
        ? raw.required
        : raw.required === null
          ? null
          : undefined,
  }
}

function buildSummary(items: TodoItemApi[]): TodoSummary {
  const total = items.length
  const completed = items.filter((i) => i.isChecked).length
  const pending = total - completed
  return {
    total,
    completed,
    pending,
    inProgress: 0,
    completionRate: total > 0 ? completed / total : 0,
  }
}

const QUERY_KEY = ["todos"] as const

async function fetchTodoList(projectId: string): Promise<{
  todos: TodoItemApi[]
  summary: TodoSummary
}> {
  const res = await fetch(`${API_BASE}/api/v2/projects/${projectId}/todos`)
  if (!res.ok) {
    throw new Error(`할일 목록을 불러오지 못했습니다 (${res.status})`)
  }
  const json = (await res.json()) as BaseResponse<TodoListData | null>
  if (!json.success || !json.data) {
    return { todos: [], summary: buildSummary([]) }
  }
  const items = Array.isArray(json.data.items)
    ? json.data.items.map((row) =>
        normalizeItem(row as unknown as Record<string, unknown>)
      )
    : []
  return { todos: items, summary: buildSummary(items) }
}

async function fetchProgress(
  projectId: string
): Promise<ResearchProgressResponse | null> {
  const res = await fetch(
    `${API_BASE}/api/v2/projects/${projectId}/todos/progress`
  )
  if (!res.ok) return null
  const json = (await res.json()) as BaseResponse<ResearchProgressResponse>
  if (!json.success || !json.data) return null
  return json.data
}

async function createTodo(
  projectId: string,
  body: TodoCreateRequest
): Promise<void> {
  const payload = {
    content: body.content,
    groupPath: body.groupPath ?? [],
    required: body.required ?? false,
    isChecked: body.isChecked ?? false,
  }
  const res = await fetch(`${API_BASE}/api/v2/projects/${projectId}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("할일 추가에 실패했습니다")
}

async function updateTodo(
  projectId: string,
  todoId: string,
  body: TodoUpdateRequest
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/v2/projects/${projectId}/todos/${todoId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) {
    let message = "할일 수정에 실패했습니다"
    try {
      const json = (await res.json()) as { detail?: string | { msg?: string }[] }
      if (typeof json.detail === "string") message = json.detail
      else if (Array.isArray(json.detail) && json.detail[0]?.msg)
        message = json.detail[0].msg
    } catch {
      // ignore parse error
    }
    throw new Error(message)
  }
}

async function deleteTodo(
  projectId: string,
  todoId: string
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/v2/projects/${projectId}/todos/${todoId}`,
    { method: "DELETE" }
  )
  if (!res.ok) {
    let message = "할일 삭제에 실패했습니다"
    try {
      const text = await res.text()
      if (text) {
        const json = JSON.parse(text) as {
          detail?: string | { msg?: string }[]
        }
        if (typeof json.detail === "string") message = json.detail
        else if (Array.isArray(json.detail) && json.detail[0]?.msg)
          message = json.detail[0].msg
      }
    } catch {
      // ignore parse error
    }
    throw new Error(message)
  }
}

export function useTodos(projectId: string | undefined) {
  const queryClient = useQueryClient()
  const queryKey = [...QUERY_KEY, projectId] as const

  const query = useQuery({
    queryKey,
    queryFn: () => fetchTodoList(projectId!),
    enabled: !!projectId,
  })

  const progressQuery = useQuery({
    queryKey: [...QUERY_KEY, "progress", projectId] as const,
    queryFn: () => fetchProgress(projectId!),
    enabled: !!projectId,
  })

  const createMutation = useMutation({
    mutationFn: (body: TodoCreateRequest) => createTodo(projectId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, "progress", projectId],
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      todoId,
      body,
    }: {
      todoId: string
      body: TodoUpdateRequest
    }) => updateTodo(projectId!, todoId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, "progress", projectId],
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (todoId: string) => deleteTodo(projectId!, todoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, "progress", projectId],
      })
    },
  })

  const listData = query.data

  return {
    todos: listData?.todos ?? [],
    summary: listData?.summary,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    progress: progressQuery.data ?? null,
    progressLoading: progressQuery.isLoading,

    createTodo: createMutation.mutateAsync,
    createPending: createMutation.isPending,

    updateTodo: updateMutation.mutateAsync,
    updatePending: updateMutation.isPending,

    deleteTodo: deleteMutation.mutateAsync,
    deletePending: deleteMutation.isPending,
  }
}
