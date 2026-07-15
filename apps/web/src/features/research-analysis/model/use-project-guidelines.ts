import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { API_BASE } from "@/shared/config/api"

interface GuidelineContentResponse {
  content: string
}

interface GuidelineResponse {
  content: string
  version: number
  updatedAt?: string | null
}

interface BaseResponse<T> {
  success: boolean
  statusCode: number
  data: T | null
}

export function useProjectGuidelines(projectId: string | undefined) {
  return useQuery({
    queryKey: ["projectGuidelines", projectId],
    queryFn: async () => {
      if (!projectId) throw new Error("Project ID required")
      const res = await fetch(
        `${API_BASE}/api/v2/projects/${projectId}/guidelines`
      )
      if (!res.ok) throw new Error("Failed to fetch guidelines")
      const json = (await res.json()) as BaseResponse<GuidelineContentResponse>
      if (!json.success || !json.data) return ""
      return json.data.content
    },
    enabled: !!projectId,
  })
}

export function useUpdateProjectGuidelines(projectId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      content,
      baseVersion,
    }: {
      content: string
      baseVersion?: number | null
    }) => {
      if (!projectId) throw new Error("Project ID required")
      const res = await fetch(
        `${API_BASE}/api/v2/projects/${projectId}/guidelines`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, baseVersion }),
        }
      )
      if (!res.ok) throw new Error("Failed to update guidelines")
      const json = (await res.json()) as BaseResponse<GuidelineResponse>
      if (!json.success || !json.data) throw new Error("Update failed")
      return json.data
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData(
        ["projectGuidelines", projectId],
        variables.content
      )
    },
  })
}
