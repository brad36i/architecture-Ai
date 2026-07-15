import { useQuery } from "@tanstack/react-query"
import { API_BASE } from "@/shared/config/api"
import type { MemoryUsageResponse } from "./types"

export function useMemorySidebarUsage(
  projectId: string | null,
  days: number = 30
) {
  return useQuery({
    queryKey: ["memory", "sidebar", "usage", projectId, days],
    queryFn: async () => {
      if (!projectId) throw new Error("projectId required")
      const res = await fetch(
        `${API_BASE}/api/v2/projects/${projectId}/memories/sidebar/usage?days=${days}`
      )
      const json: MemoryUsageResponse = await res.json()
      if (!res.ok) throw new Error(json?.data ? String(json.data) : "Failed to fetch")
      return json.data
    },
    enabled: !!projectId,
  })
}
