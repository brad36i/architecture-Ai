"use client"

import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { fetchTopicNodePriorResearch } from "./topic-node-prior-research-api"

export function useTopicNodePriorResearch(
  projectId: string,
  backendTopicNodeId: string | null,
  enabled: boolean
) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ["topicNodePriorResearch", "v2", projectId, backendTopicNodeId ?? ""],
    queryFn: () => fetchTopicNodePriorResearch(projectId, backendTopicNodeId!),
    enabled: Boolean(projectId && backendTopicNodeId && enabled),
  })

  useEffect(() => {
    if (query.isSuccess && query.data?.id) {
      void queryClient.invalidateQueries({
        queryKey: ["relatedWorksHistories", "v2", projectId],
      })
    }
  }, [query.isSuccess, query.data?.id, projectId, queryClient])

  return query
}
