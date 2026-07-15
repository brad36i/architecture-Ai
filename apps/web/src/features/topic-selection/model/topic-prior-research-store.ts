import { create } from "zustand"

/**
 * nodeId <-> historyId 매핑 (세션 메모리만, persist 없음).
 * 선행연구 목록·상세는 GET prior/research API가 단일 소스.
 */
interface TopicPriorResearchState {
  /** nodeId -> historyId */
  nodeToHistory: Record<string, string>
  /** 삭제된 노드 ID */
  deletedNodeIds: string[]
  registerHistory: (params: { nodeId: string; projectId: string; keyword: string }) => string
  markNodeDeleted: (nodeId: string) => void
  isNodeDeleted: (nodeId: string) => boolean
  getNodeIdByHistoryId: (historyId: string) => string | null
}

let historyIdCounter = 1000

function generateHistoryId() {
  return `hist-node-${historyIdCounter++}`
}

export const useTopicPriorResearchStore = create<TopicPriorResearchState>()((set, get) => ({
  nodeToHistory: {},
  deletedNodeIds: [],

  registerHistory: ({ nodeId, projectId: _p, keyword: _k }) => {
    const existing = get().nodeToHistory[nodeId]
    if (existing) return existing

    const historyId = generateHistoryId()
    set((s) => ({
      nodeToHistory: { ...s.nodeToHistory, [nodeId]: historyId },
    }))
    return historyId
  },

  markNodeDeleted: (nodeId) => {
    set((s) =>
      s.deletedNodeIds.includes(nodeId) ? s : { deletedNodeIds: [...s.deletedNodeIds, nodeId] }
    )
  },

  isNodeDeleted: (nodeId) => get().deletedNodeIds.includes(nodeId),

  getNodeIdByHistoryId: (historyId) => {
    const mapping = get().nodeToHistory
    for (const [nodeId, hid] of Object.entries(mapping)) {
      if (hid === historyId) return nodeId
    }
    return null
  },
}))
