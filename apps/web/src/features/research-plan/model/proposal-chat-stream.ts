"use client"

import { API_BASE } from "@/shared/config/api"

export interface ProposalChatHistoryItem {
  role?: string
  content?: string
  createdAt?: string | null
  unifiedDiff?: string | null
}

interface BaseResponse<T> {
  success: boolean
  statusCode: number
  data: T | null
  message?: string
}

export interface ProposalProgressEvent {
  type: "progress"
  step?: string
  message?: string
  done?: boolean
  status?: string
  agent?: string
  plan?: {
    goal?: string
    actions?: string[]
    reasoning?: string
    steps?: Array<{
      id?: string
      agent?: string
      title?: string
      blocking?: boolean
      status?: string
      summary?: string
    }>
  }
  [key: string]: unknown
}

export interface ProposalThinkingEvent {
  type: "thinking"
  step?: string
  content?: string
  [key: string]: unknown
}

export interface ProposalChatEvent {
  type: "chat"
  role?: "assistant" | "user" | "agent"
  content?: string
  unifiedDiff?: string | null
  [key: string]: unknown
}

export interface ProposalDoneData {
  progress?: ProposalProgressEvent[]
  chat?: ProposalChatEvent[]
  thinking?: ProposalThinkingEvent[]
  synthesis_summary?: string
  output_shape?: string
  reasoning?: string
  source?: string
  llm_model?: string
  llm_reasoning?: string
  final_response?: {
    mode?: string
    output_shape?: string
    actions?: string[]
    warnings?: string[]
    reasoning?: string
    action_results?: Array<{
      action?: string
      summary?: string
      payload?: {
        message?: string
        [key: string]: unknown
      }
      [key: string]: unknown
    }>
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface ProposalChatStreamParams {
  userMessage: string
  sessionId?: number
  linePosition?: number | null
  startLine?: number | null
  endLine?: number | null
  model?: string
  reasoning?: "high" | "medium" | "low"
}

export interface ProposalChatCallbacks {
  onProgress?: (event: ProposalProgressEvent) => void
  onThinking?: (event: ProposalThinkingEvent) => void
  onChat?: (event: ProposalChatEvent) => void
  onDone?: (data: ProposalDoneData) => void
  onError?: (message: string) => void
}

function extractErrorMessage(payload: Record<string, unknown>) {
  const message = payload.message
  if (typeof message === "string" && message.trim()) return message

  const detail = payload.detail
  if (typeof detail === "string" && detail.trim()) return detail

  return "건축 제안서 채팅 요청에 실패했습니다."
}

function normalizeProposalSsePayload(parsed: Record<string, unknown>): {
  eventType: string
  body: Record<string, unknown>
} {
  const top = parsed?.type
  if (typeof top === "string" && top.length > 0) {
    return { eventType: top, body: parsed }
  }

  const wrapped = parsed?.data
  if (wrapped && typeof wrapped === "object" && !Array.isArray(wrapped)) {
    const inner = wrapped as Record<string, unknown>
    const nested = inner.type
    if (typeof nested === "string" && nested.length > 0) {
      return { eventType: nested, body: inner }
    }
  }

  return { eventType: "", body: parsed }
}

function extractDoneInnerPayload(body: Record<string, unknown>): ProposalDoneData {
  const nested = body.data
  if (
    nested !== undefined &&
    nested !== null &&
    typeof nested === "object" &&
    !Array.isArray(nested)
  ) {
    return nested as ProposalDoneData
  }

  const { type, ...rest } = body
  void type
  return rest as ProposalDoneData
}

function buildProposalChatStreamUrl(
  projectId: string,
  endpoint: "chat" | "agent",
  {
    userMessage,
    sessionId = 1,
    linePosition,
    startLine,
    endLine,
    model,
    reasoning,
  }: ProposalChatStreamParams
) {
  const params = new URLSearchParams()
  params.set("user_message", userMessage)
  params.set("session_id", String(sessionId))

  if (linePosition != null) params.set("line_position", String(linePosition))
  if (startLine != null) params.set("start_line", String(startLine))
  if (endLine != null) params.set("end_line", String(endLine))
  if (model?.trim()) params.set("model", model.trim())
  if (reasoning) params.set("reasoning", reasoning)

  const apiVersion = endpoint === "agent" ? "v3" : "v2"
  return `${API_BASE}/api/${apiVersion}/projects/${encodeURIComponent(projectId)}/proposals/${endpoint}/stream?${params.toString()}`
}

async function fetchProposalStream(
  projectId: string,
  endpoint: "chat" | "agent",
  payload: ProposalChatStreamParams,
  callbacks: ProposalChatCallbacks = {},
  signal?: AbortSignal
): Promise<ProposalDoneData | null> {
  const requestUrl = buildProposalChatStreamUrl(projectId, endpoint, payload)

  console.info(`[proposal-${endpoint}][request:start]`, {
    projectId,
    requestUrl,
    sessionId: payload.sessionId ?? 1,
    linePosition: payload.linePosition ?? null,
    startLine: payload.startLine ?? null,
    endLine: payload.endLine ?? null,
    model: payload.model ?? null,
    reasoning: payload.reasoning ?? null,
  })

  const res = await fetch(requestUrl, {
    headers: { Accept: "text/event-stream" },
    signal,
  })

  console.info(`[proposal-${endpoint}][request:response]`, {
    projectId,
    status: res.status,
    ok: res.ok,
  })

  if (!res.ok) {
    const message = `API 오류: ${res.status}`
    callbacks.onError?.(message)
    throw new Error(message)
  }

  const reader = res.body?.getReader()
  if (!reader) {
    const message = "스트림을 읽을 수 없습니다"
    callbacks.onError?.(message)
    throw new Error(message)
  }

  const decoder = new TextDecoder()
  let buffer = ""
  let dataBuffer = ""
  let doneData: ProposalDoneData | null = null

  const processPayload = (raw: string) => {
    const value = raw.trim()
    if (!value) return

    try {
      const parsed = JSON.parse(value) as Record<string, unknown>
      const { eventType, body } = normalizeProposalSsePayload(parsed)

      if (eventType === "progress") {
        callbacks.onProgress?.(body as unknown as ProposalProgressEvent)
        return
      }

      if (eventType === "thinking") {
        callbacks.onThinking?.(body as unknown as ProposalThinkingEvent)
        return
      }

      if (eventType === "chat") {
        callbacks.onChat?.(body as unknown as ProposalChatEvent)
        return
      }

      if (eventType === "done") {
        doneData = extractDoneInnerPayload(body)
        callbacks.onDone?.(doneData)
        return
      }

      if (eventType === "error") {
        callbacks.onError?.(extractErrorMessage({ ...parsed, ...body }))
      }
    } catch {
      // ignore malformed chunks
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        const normalizedLine = line.replace(/\r$/, "")

        if (normalizedLine.startsWith("data:")) {
          dataBuffer += (dataBuffer ? "\n" : "") + normalizedLine.slice(5).trimStart()
        } else if (normalizedLine === "" && dataBuffer) {
          processPayload(dataBuffer)
          dataBuffer = ""
        } else if (normalizedLine !== "" && !normalizedLine.startsWith("event:")) {
          dataBuffer += "\n" + normalizedLine
        }
      }

      if (done) break
    }

    if (dataBuffer) processPayload(dataBuffer)
  } finally {
    reader.releaseLock()
  }

  return doneData
}

export async function fetchProposalChatHistory(
  projectId: string,
  sessionId = 1
): Promise<ProposalChatHistoryItem[]> {
  const params = new URLSearchParams()
  params.set("session_id", String(sessionId))

  const res = await fetch(
    `${API_BASE}/api/v2/projects/${encodeURIComponent(projectId)}/proposals/chat/history?${params.toString()}`
  )

  let json: BaseResponse<ProposalChatHistoryItem[]>
  try {
    json = (await res.json()) as BaseResponse<ProposalChatHistoryItem[]>
  } catch {
    throw new Error(`건축 제안서 채팅 이력 조회 실패 (${res.status})`)
  }

  if (!res.ok) {
    throw new Error(
      typeof json.message === "string" && json.message.trim()
        ? json.message
        : `건축 제안서 채팅 이력 조회 실패 (${res.status})`
    )
  }

  if (!json.success || !json.data) return []
  return json.data
}

export function getLatestAssistantChat(
  data: ProposalDoneData | null | undefined
): ProposalChatEvent | null {
  const assistantChat =
    [...(data?.chat ?? [])]
      .reverse()
      .find(
        (item) =>
          (item.role === "assistant" || item.role === "agent") &&
          ((typeof item.content === "string" && item.content.trim()) ||
            (typeof item.unifiedDiff === "string" && item.unifiedDiff.trim()))
      ) ?? null

  if (assistantChat) return assistantChat

  const finalResponse = data?.final_response
  if (finalResponse && typeof finalResponse === "object") {
    const actionResult = [...(finalResponse.action_results ?? [])].reverse().find((item) => {
      const summary = item?.summary
      const payloadMessage = item?.payload?.message
      return (
        (typeof summary === "string" && summary.trim()) ||
        (typeof payloadMessage === "string" && payloadMessage.trim())
      )
    })

    const content =
      actionResult?.payload?.message?.trim() ||
      actionResult?.summary?.trim() ||
      data?.synthesis_summary?.trim() ||
      null

    if (content) {
      return {
        type: "chat",
        role: "assistant",
        content,
      }
    }
  }

  const synthesisSummary = data?.synthesis_summary?.trim()
  if (synthesisSummary) {
    return {
      type: "chat",
      role: "assistant",
      content: synthesisSummary,
    }
  }

  return null
}

export async function fetchProposalChatStream(
  projectId: string,
  payload: ProposalChatStreamParams,
  callbacks: ProposalChatCallbacks = {},
  signal?: AbortSignal
) {
  return fetchProposalStream(projectId, "chat", payload, callbacks, signal)
}

export async function fetchProposalAgentStream(
  projectId: string,
  payload: ProposalChatStreamParams,
  callbacks: ProposalChatCallbacks = {},
  signal?: AbortSignal
) {
  return fetchProposalStream(
    projectId,
    "agent",
    {
      ...payload,
      model: payload.model ?? "gpt-5-mini",
      reasoning: payload.reasoning ?? "low",
    },
    callbacks,
    signal
  )
}
