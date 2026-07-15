import { useQuery } from "@tanstack/react-query"
import { API_BASE } from "@/shared/config/api"
import type { MemorySidebarResponse } from "./types"

export function useMemorySidebar(projectId: string | null) {
  return useQuery({
    queryKey: ["memory", "sidebar", projectId],
    queryFn: async () => {
      if (!projectId) throw new Error("projectId required")
      const res = await fetch(
        `${API_BASE}/api/v2/projects/${projectId}/memories/sidebar`
      )
      const json: MemorySidebarResponse = await res.json()
      if (!res.ok) throw new Error(json?.data ? String(json.data) : "Failed to fetch")
      return json.data
    },
    enabled: !!projectId,
  })
}
