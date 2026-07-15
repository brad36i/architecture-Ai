"use client"

import { API_BASE } from "@/shared/config/api"

export interface ProposalCreateProgressEvent {
  type: "progress"
  step?: string
  message?: string
  done?: boolean
}

export interface ProposalCreateChatEvent {
  type: "chat"
  role?: "assistant" | "user"
  content?: string
}

export interface ProposalCreateThinkingEvent {
  type: "thinking"
  step?: string
  content?: string
}

export interface ProposalCreateDoneData {
  progress?: ProposalCreateProgressEvent[]
  chat?: ProposalCreateChatEvent[]
  thinking?: ProposalCreateThinkingEvent[]
}

export interface ProposalCreateCallbacks {
  onProgress?: (event: ProposalCreateProgressEvent) => void
  onChat?: (event: ProposalCreateChatEvent) => void
  onDone?: (data: ProposalCreateDoneData) => void
  onError?: (message: string) => void
}

export interface ProposalCreateStreamParams {
  nodeId: string
  sessionId?: number
  apiVersion?: "v2" | "v3"
}

function extractErrorMessage(payload: Record<string, unknown>) {
  const message = payload.message
  if (typeof message === "string" && message.trim()) return message

  const detail = payload.detail
  if (typeof detail === "string" && detail.trim()) return detail

  return "건축 제안서 초안 생성에 실패했습니다."
}

/** `{ "data": { "type": "done", ... } }` 등 type이 중첩된 SSE 페이로드 정규화 */
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

export function getProposalDraftFromDoneData(data: ProposalCreateDoneData | null | undefined) {
  const assistantMessage = [...(data?.chat ?? [])]
    .reverse()
    .find((item) => item.role === "assistant" && typeof item.content === "string" && item.content.trim())

  return assistantMessage?.content?.trim() ?? ""
}

export async function fetchProposalCreateStream(
  projectId: string,
  { nodeId, sessionId = 1, apiVersion = "v3" }: ProposalCreateStreamParams,
  callbacks: ProposalCreateCallbacks = {}
): Promise<ProposalCreateDoneData | null> {
  const params = new URLSearchParams()
  params.set("node_id", nodeId)
  params.set("session_id", String(sessionId))
  const requestUrl = `${API_BASE}/api/${apiVersion}/projects/${projectId}/proposals/create/stream?${params.toString()}`

  console.info("[proposal-create][request:start]", {
    apiVersion,
    projectId,
    nodeId,
    sessionId,
    requestUrl,
  })

  const res = await fetch(requestUrl, {
    headers: { Accept: "text/event-stream" },
  })

  console.info("[proposal-create][request:response]", {
    apiVersion,
    projectId,
    nodeId,
    sessionId,
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
  let doneData: ProposalCreateDoneData | null = null

  const processPayload = (raw: string) => {
    const value = raw.trim()
    if (!value) return

    try {
      const parsed = JSON.parse(value) as Record<string, unknown>
      const { eventType, body } = normalizeProposalSsePayload(parsed)

      if (eventType === "progress") {
        console.info("[proposal-create][sse:progress]", body)
        callbacks.onProgress?.(body as unknown as ProposalCreateProgressEvent)
        return
      }

      if (eventType === "chat") {
        console.info("[proposal-create][sse:chat]", body)
        callbacks.onChat?.(body as unknown as ProposalCreateChatEvent)
        return
      }

      if (eventType === "thinking") {
        return
      }

      if (eventType === "done") {
        const inner =
          body.data !== undefined && body.data !== null && typeof body.data === "object"
            ? (body.data as ProposalCreateDoneData)
            : (() => {
                const { type, ...rest } = body
                void type
                return rest as ProposalCreateDoneData
              })()
        doneData = inner
        console.info("[proposal-create][sse:done]", doneData)
        callbacks.onDone?.(doneData)
        return
      }

      if (eventType === "error") {
        console.error("[proposal-create][sse:error]", { parsed, body })
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
