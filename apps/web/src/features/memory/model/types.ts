/** GET /api/v2/projects/{project_id}/memories/sidebar 응답 스키마 */

export interface MemorySidebarAgent {
  id?: string
  name?: string
  [key: string]: unknown
}

export interface MemorySidebarData {
  currentStep: number
  currentStepLabel: string
  agents: MemorySidebarAgent[]
  totalInputTokens: number
  totalOutputTokens: number
  totalThinkingTokens: number
  estimatedCostUsd: number
  sessionCount: number
}

export interface MemorySidebarResponse {
  success: boolean
  statusCode: number
  data: MemorySidebarData
}

/** GET /api/v2/projects/{project_id}/memories/sidebar/usage 응답 스키마 */

export interface MemoryUsageByAgent {
  agentId?: string
  agentName?: string
  inputTokens?: number
  outputTokens?: number
  thinkingTokens?: number
  costUsd?: number
  [key: string]: unknown
}

export interface MemoryUsageByDate {
  date?: string
  inputTokens?: number
  outputTokens?: number
  thinkingTokens?: number
  costUsd?: number
  [key: string]: unknown
}

export interface MemoryUsageData {
  totalInputTokens: number
  totalOutputTokens: number
  totalThinkingTokens: number
  estimatedCostUsd: number
  byAgent: MemoryUsageByAgent[]
  byDate: MemoryUsageByDate[]
}

export interface MemoryUsageResponse {
  success: boolean
  statusCode: number
  data: MemoryUsageData
}
