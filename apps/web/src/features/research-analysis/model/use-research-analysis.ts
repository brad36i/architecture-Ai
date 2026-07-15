import { useQuery } from "@tanstack/react-query"
import { API_BASE } from "@/shared/config/api"
import type { ResearchAnalysis } from "./types"

export function useResearchAnalysis(projectId: string) {
  return useQuery({
    queryKey: ["researchAnalysis", projectId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/researchAnalysis/${projectId}`)
      if (!res.ok) throw new Error("Failed to fetch research analysis")
      return res.json() as Promise<ResearchAnalysis>
    },
    enabled: !!projectId,
  })
}
