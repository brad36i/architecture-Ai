import { API_BASE } from "@/shared/config/api"
import type {
  PriorResearchResponse,
  PriorResearchSingleApiResponse,
} from "@/features/related-works/model/prior-research-api"

export async function fetchTopicNodePriorResearch(
  projectId: string,
  topicNodeId: string
): Promise<PriorResearchResponse> {
  const encoded = encodeURIComponent(topicNodeId)
  const res = await fetch(
    `${API_BASE}/api/v2/projects/${projectId}/topics/${encoded}/prior/research`
  )
  let json: PriorResearchSingleApiResponse
  try {
    json = (await res.json()) as PriorResearchSingleApiResponse
  } catch {
    throw new Error(`토픽 선행연구 조회 실패 (${res.status})`)
  }
  if (!res.ok) {
    const msg = (json as { message?: string }).message
    throw new Error(
      typeof msg === "string" && msg.trim()
        ? msg
        : `토픽 선행연구 조회 실패 (${res.status})`
    )
  }
  if (!json.success || json.data == null) {
    throw new Error("토픽 선행연구 응답이 올바르지 않습니다")
  }
  return json.data
}
