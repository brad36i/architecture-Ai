'use client';

import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Loader2, FilePlus } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

import {
  fetchProposalCreateStream,
  getProposalDraftFromDoneData,
  useResearchPlanStore,
} from '@/features/research-plan';
import {
  InputNode,
  TopicNode,
  DepthControlsContext,
  getProposalDraftReadyKey,
  useTopicLayoutStore,
  useTopicSiblingOrderStore,
  useProposalDraftReadyStore,
  useTopicPriorResearchStore,
  useTopicSelection,
  defaultState,
  TOPIC_PROMPT_NODE_ID,
  type TopicContent,
  NODE_OFFSET_X,
  NODE_OFFSET_Y,
  INPUT_NODE_X,
  INPUT_NODE_Y,
  defaultEdgeOptions,
  solidEdgeOptions,
  generateHypothesis,
  refineTopic,
  mergeTopicContents,
  summarizeTopicForSelection,
} from '@/features/topic-selection';
import { computeNextNodeIdRef } from '@/features/topic-selection/model/use-topic-selection';
import {
  fetchTopicSelectionGenerateStream,
  fetchTopicSelectionStartStream,
  fetchTopicSelectionExpandStream,
  fetchTopicSelectionFinishStream,
  fetchTopicSelectionMergeStream,
  type BackendTopic,
  mapFinishDoneDataToSelectedContent,
  mapFinishDoneDataToBackendTopic,
  mapBackendTopicToTopicContent,
  parseSuggestedTextToTopics,
} from '@/features/topic-selection/model/use-topic-selection-start-stream';
import { PageHeader } from '@/shared/ui/page-header';

// ============================================================================
// nodeTypes는 모듈 레벨에 정의 (렌더링마다 재생성 방지)
// ============================================================================

const nodeTypes = {
  prompt: InputNode,
  topic: TopicNode,
};

const RESEARCH_PLAN_SESSION_ID = 1;

const LOCAL_TOPIC_PLACEHOLDER_ID = /^topic-\d+$/;

/** API 스냅샷에 아직 없는 로컬 전용 토픽 노드 — refetch 직후 잠깐 사라지는 깜빡임 방지 */
function isLocalTopicNodeToPreserveDuringSync(node: Node, hydratedIds: Set<string>): boolean {
  if (node.type !== 'topic' || hydratedIds.has(node.id)) return false;
  const d = node.data as Record<string, unknown> | undefined;
  if (!d) return false;
  const placeholderish = LOCAL_TOPIC_PLACEHOLDER_ID.test(node.id);
  if (d.isTemporaryNode === true) return true;
  if (placeholderish && d.isNew === true) return true;
  if (placeholderish && d.isLoading === true) return true;
  return false;
}

/** ReactFlow node.data.depth — 서버가 준 양수 depth는 그대로 사용 */
function layoutDepthFromNodeData(data: Record<string, unknown> | undefined): number {
  const d = data?.depth as number | undefined;
  if (typeof d === 'number' && d > 0) return d;
  return 1;
}

/** 엣지 기준 부모별 자식 id — 현재 y로 정렬해 형제 순서를 안정적으로 기록 */
function computeSiblingOrdersFromEdges(nodes: Node[], edges: Edge[]): Record<string, string[]> {
  const yById = new Map(nodes.map((n) => [n.id, n.position?.y ?? 0]));
  const byParent = new Map<string, { id: string; y: number }[]>();
  for (const e of edges) {
    const target = e.target;
    if (!target) continue;
    const targetNode = nodes.find((n) => n.id === target);
    if (targetNode?.type !== 'topic') continue;
    const list = byParent.get(e.source) ?? [];
    list.push({ id: target, y: yById.get(target) ?? 0 });
    byParent.set(e.source, list);
  }
  const out: Record<string, string[]> = {};
  for (const [parentId, items] of byParent) {
    items.sort((a, b) => a.y - b.y);
    out[parentId] = items.map((i) => i.id);
  }
  return out;
}

function mergeEdgesKeepingLocal(
  apiEdges: Edge[],
  prevEdges: Edge[],
  preservedLocalIds: Set<string>
): Edge[] {
  const key = (e: Edge) => `${e.source}|${e.target}`;
  const next = [...apiEdges];
  const seen = new Set(next.map(key));
  for (const e of prevEdges) {
    if (!preservedLocalIds.has(e.source) && !preservedLocalIds.has(e.target)) continue;
    const k = key(e);
    if (seen.has(k)) continue;
    seen.add(k);
    next.push(e);
  }
  return next;
}
// ============================================================================
// TopicSelectionView
// ============================================================================

export function TopicSelectionView() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusNodeId = searchParams.get('focusNode');
  const projectId = (params?.id as string) ?? '';
  const registerHistory = useTopicPriorResearchStore((s) => s.registerHistory);
  const markNodeDeleted = useTopicPriorResearchStore((s) => s.markNodeDeleted);
  const topicLayoutHydrated = useTopicLayoutStore((s) => s._hasHydrated);
  const setProjectTopicPositions = useTopicLayoutStore((s) => s.setProjectPositions);
  const moveTopicNodePosition = useTopicLayoutStore((s) => s.moveNodePosition);
  const siblingOrderHydrated = useTopicSiblingOrderStore((s) => s._hasHydrated);
  const mergeSiblingOrders = useTopicSiblingOrderStore((s) => s.mergeOrders);
  const replaceSiblingChildId = useTopicSiblingOrderStore((s) => s.replaceChildId);
  const clearSiblingOrdersProject = useTopicSiblingOrderStore((s) => s.clearProject);
  const proposalDraftReadyMap = useProposalDraftReadyStore((s) => s.readyByKey);
  const proposalDraftReadyHydrated = useProposalDraftReadyStore((s) => s._hasHydrated);
  const markProposalDraftReady = useProposalDraftReadyStore((s) => s.markReady);
  const clearProposalDraftReady = useProposalDraftReadyStore((s) => s.clearReady);
  const clearProjectProposalDraftReady = useProposalDraftReadyStore((s) => s.clearProject);
  const initializeProposalDraft = useResearchPlanStore((s) => s.initializeProposalDraft);
  const {
    state: apiState,
    isInitialLoad,
    isLoading,
    dataUpdatedAt,
    isError,
    refresh,
    deleteAllNodes,
    deleteNode,
    isDeletingAll,
  } = useTopicSelection(projectId);
  const [isClient, setIsClient] = useState(false);
  const [nodes, setNodes] = useState<Node[]>(defaultState.nodes);
  const [edges, setEdges] = useState<Edge[]>(defaultState.edges);
  const [isMergingTopics, setIsMergingTopics] = useState(false);
  const nodeIdRef = useRef(defaultState.nodeIdRef);
  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const pendingFitViewIdsRef = useRef<string[] | null>(null);
  const nodesEdgesRef = useRef({ nodes: defaultState.nodes, edges: defaultState.edges });
  nodesEdgesRef.current = { nodes, edges };

  const getStoredProposalDraftReady = useCallback(
    (backendNodeId: string | null | undefined) => {
      if (!projectId || !backendNodeId) return false;
      return Boolean(proposalDraftReadyMap[getProposalDraftReadyKey(projectId, backendNodeId)]);
    },
    [projectId, proposalDraftReadyMap]
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // ---- API에서 상태 로드 ----
  useEffect(() => {
    if (!projectId || isLoading || !apiState || !topicLayoutHydrated) return;
    const hydratedFromApi = apiState.nodes.map((node) => {
      if (node.type !== 'topic') return node;

      const existingHistoryId = node.data?.historyId as string | undefined;
      if (existingHistoryId) return node;

      const content = node.data?.content as TopicContent | undefined;
      const keyword = (content?.subject ?? (node.data?.label as string) ?? '').trim();
      if (!keyword) return node;

      return {
        ...node,
        position: node.position,
        data: {
          ...node.data,
          isTemporaryNode: false,
          isProposalDraftReady: getStoredProposalDraftReady(node.id),
          historyId: registerHistory({ nodeId: node.id, projectId, keyword }),
        },
      };
    });

    const prevNodes = nodesEdgesRef.current.nodes;
    const prevEdges = nodesEdgesRef.current.edges;
    const hydratedIds = new Set(hydratedFromApi.map((n) => n.id));
    const preservedLocal = prevNodes.filter((n) =>
      isLocalTopicNodeToPreserveDuringSync(n, hydratedIds)
    );
    const preservedLocalIds = new Set(preservedLocal.map((n) => n.id));

    const localUi = new Map(
      prevNodes.map((n) => [
        n.id,
        {
          checked: Boolean(n.data?.checked),
          pinned: Boolean(n.data?.pinned),
        },
      ])
    );

    const apiMerged = hydratedFromApi.map((node) => {
      if (node.type !== 'topic') return node;
      const ui = localUi.get(node.id);
      if (!ui) return node;
      return {
        ...node,
        data: {
          ...node.data,
          checked: ui.checked,
          pinned: ui.pinned,
        },
      };
    });

    const mergedNodes = [...apiMerged, ...preservedLocal];
    setNodes(mergedNodes);
    setEdges(mergeEdgesKeepingLocal(apiState.edges, prevEdges, preservedLocalIds));
    nodeIdRef.current = Math.max(apiState.nodeIdRef, computeNextNodeIdRef(mergedNodes));
  }, [
    projectId,
    isLoading,
    apiState,
    dataUpdatedAt,
    registerHistory,
    getStoredProposalDraftReady,
    topicLayoutHydrated,
  ]);

  useEffect(() => {
    if (!projectId || !topicLayoutHydrated || isLoading) return;

    const timer = window.setTimeout(() => {
      const nextPositions = Object.fromEntries(
        nodes
          .filter((node) => node.type === 'topic')
          .map((node) => [
            node.id,
            {
              x: node.position?.x ?? INPUT_NODE_X + NODE_OFFSET_X,
              y: node.position?.y ?? INPUT_NODE_Y,
            },
          ])
      );
      setProjectTopicPositions(projectId, nextPositions);
    }, 150);

    return () => window.clearTimeout(timer);
  }, [projectId, nodes, topicLayoutHydrated, isLoading, setProjectTopicPositions]);

  useEffect(() => {
    if (!projectId || !siblingOrderHydrated || isLoading) return;
    const byParent = computeSiblingOrdersFromEdges(nodes, edges);
    if (Object.keys(byParent).length === 0) return;
    mergeSiblingOrders(projectId, byParent);
  }, [projectId, nodes, edges, siblingOrderHydrated, isLoading, mergeSiblingOrders]);

  useEffect(() => {
    if (!projectId || !proposalDraftReadyHydrated) return;

    setNodes((nds) => {
      let hasChanged = false;

      const nextNodes = nds.map((node) => {
        if (node.type !== 'topic') return node;

        const backendNodeId =
          (node.data?.backendNodeId as string | undefined)?.trim() ||
          (!node.data?.isTemporaryNode ? node.id : '');
        const isProposalDraftReady = getStoredProposalDraftReady(backendNodeId);

        if ((node.data?.isProposalDraftReady as boolean | undefined) === isProposalDraftReady) {
          return node;
        }

        hasChanged = true;
        return {
          ...node,
          data: {
            ...node.data,
            isProposalDraftReady,
          },
        };
      });

      return hasChanged ? nextNodes : nds;
    });
  }, [getStoredProposalDraftReady, projectId, proposalDraftReadyHydrated]);

  // ---- ReactFlow 기본 핸들러 ----

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds) as Node[]),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback((params: Connection) => {
    if (params.source !== params.target) {
      setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds));
    }
  }, []);

  // ---- fitView 트리거 ----

  useEffect(() => {
    if (focusNodeId && nodes.some((n) => n.id === focusNodeId)) {
      pendingFitViewIdsRef.current = [focusNodeId];
    }
  }, [focusNodeId, nodes]);

  useEffect(() => {
    const ids = pendingFitViewIdsRef.current;
    if (!ids || !reactFlowRef.current) return;
    const allExist = ids.every((id) => nodes.some((n) => n.id === id));
    if (!allExist) return;
    reactFlowRef.current.fitView({
      nodes: ids.map((id) => ({ id })),
      padding: 0.2,
      maxZoom: 0.85,
      duration: 400,
    });
    pendingFitViewIdsRef.current = null;
  }, [nodes]);

  const upsertTopicNodesFromBackend = useCallback(
    (backendTopics: BackendTopic[], options?: { complete?: boolean; fallbackPrompt?: string }) => {
      const { nodes: currentNodes } = nodesEdgesRef.current;
      const currentInputNode = currentNodes.find((n) => n.type === 'prompt');
      if (!currentInputNode) return;

      const topics =
        backendTopics.length > 0
          ? backendTopics.slice(0, 5).map(mapBackendTopicToTopicContent)
          : parseSuggestedTextToTopics(options?.fallbackPrompt ?? '');

      if (topics.length === 0) return;

      const baseX = (currentInputNode.position?.x ?? INPUT_NODE_X) + NODE_OFFSET_X;
      const baseY = currentInputNode.position?.y ?? INPUT_NODE_Y;

      const nextTopicNodes: Node[] = topics.map((content, index) => {
        const backendTopic = backendTopics[index];
        const nodeId =
          backendTopic?.nodeId ??
          backendTopic?.node_id ??
          backendTopic?.id ??
          `topic-${nodeIdRef.current++}`;
        const existingNode = currentNodes.find((n) => n.id === nodeId);
        const historyId =
          (existingNode?.data?.historyId as string | undefined) ??
          registerHistory({
            nodeId,
            projectId,
            keyword: content.subject,
          });

        return {
          id: nodeId,
          type: 'topic',
          position: existingNode?.position ?? {
            x: baseX,
            y: baseY + (index - (topics.length - 1) / 2) * NODE_OFFSET_Y,
          },
          data: {
            ...(existingNode?.data ?? {}),
            label: content.subject,
            content,
            isTemporaryNode: false,
            backendNodeId:
              backendTopic?.nodeId ??
              backendTopic?.node_id ??
              backendTopic?.id ??
              (existingNode?.data?.backendNodeId as string | undefined),
            keywords: content.keywords,
            checked: (existingNode?.data?.checked as boolean) ?? false,
            pinned: (existingNode?.data?.pinned as boolean) ?? false,
            depth: 1,
            tag:
              (backendTopic?.label as string) ?? (existingNode?.data?.tag as string) ?? '연구확장',
            isLoading: false,
            isLastNode: backendTopic?.isLastNode ?? backendTopic?.is_last_node ?? false,
            historyId,
          },
        };
      });

      const nextEdges: Edge[] = nextTopicNodes.map((node) => ({
        id: `edge-${currentInputNode.id}-${node.id}`,
        source: currentInputNode.id,
        target: node.id,
        ...defaultEdgeOptions,
      }));

      setNodes((nds) => {
        const updated = nds.map((n) =>
          n.type === 'prompt'
            ? {
                ...n,
                data: {
                  ...n.data,
                  ...(options?.complete
                    ? {
                        isLoading: false,
                        hasCompleted: true,
                        streamStepLabel: undefined,
                        streamStepKey: undefined,
                        streamDetails: undefined,
                      }
                    : {}),
                },
              }
            : n
        );

        nextTopicNodes.forEach((nextNode) => {
          const idx = updated.findIndex((n) => n.id === nextNode.id);
          if (idx >= 0) {
            updated[idx] = nextNode;
          } else {
            updated.push(nextNode);
          }
        });

        return updated;
      });

      setEdges((eds) => {
        const next = [...eds];
        nextEdges.forEach((edge) => {
          if (!next.some((e) => e.id === edge.id)) next.push(edge);
        });
        return next;
      });

      pendingFitViewIdsRef.current = [currentInputNode.id, ...nextTopicNodes.map((n) => n.id)];
    },
    [projectId, registerHistory]
  );

  const setTopicNodeStreamProgress = useCallback(
    (nodeId: string, step?: string, message?: string) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId) return n;
          const prevStepKey = n.data?.streamStepKey as string | undefined;
          const shouldResetDetails = step && prevStepKey && prevStepKey !== step;
          return {
            ...n,
            data: {
              ...n.data,
              isLoading: true,
              streamStepKey: step ?? prevStepKey,
              streamStepLabel:
                message ?? (n.data?.streamStepLabel as string) ?? '연구내용 구체화 중...',
              streamDetails: shouldResetDetails ? [] : ((n.data?.streamDetails as string[]) ?? []),
            },
          };
        })
      );
    },
    []
  );

  const appendTopicNodeThinking = useCallback((nodeId: string, content?: string) => {
    if (!content) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== nodeId) return n;
        const prev = (n.data?.streamDetails as string[] | undefined) ?? [];
        const nextDetails =
          prev.length === 0
            ? [content]
            : [...prev.slice(0, -1), `${prev[prev.length - 1]}${content}`];
        return {
          ...n,
          data: {
            ...n.data,
            isLoading: true,
            streamDetails: nextDetails,
          },
        };
      })
    );
  }, []);

  const clearTopicNodeStreamState = useCallback((nodeIds: string[]) => {
    if (nodeIds.length === 0) return;

    setNodes((nds) =>
      nds.map((n) =>
        nodeIds.includes(n.id)
          ? {
              ...n,
              data: {
                ...n.data,
                isLoading: false,
                streamStepLabel: undefined,
                streamStepKey: undefined,
                streamDetails: undefined,
              },
            }
          : n
      )
    );
  }, []);

  const removeTopicNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, []);

  const setProposalCreatingState = useCallback(
    (
      identifiers: { nodeId?: string | null; backendNodeId?: string | null },
      isProposalCreating: boolean
    ) => {
      const normalizedNodeId = identifiers.nodeId?.trim() || null;
      const normalizedBackendNodeId = identifiers.backendNodeId?.trim() || null;
      if (!normalizedNodeId && !normalizedBackendNodeId) return;

      setNodes((nds) =>
        nds.map((node) => {
          const nodeBackendNodeId =
            (node.data?.backendNodeId as string | undefined)?.trim() || null;
          const isTarget =
            (normalizedNodeId !== null && node.id === normalizedNodeId) ||
            (normalizedBackendNodeId !== null && nodeBackendNodeId === normalizedBackendNodeId);

          return isTarget
            ? {
                ...node,
                data: {
                  ...node.data,
                  isProposalCreating,
                },
              }
            : node;
        })
      );
    },
    []
  );

  const setProposalDraftReadyState = useCallback(
    (
      identifiers: { nodeId?: string | null; backendNodeId?: string | null },
      isProposalDraftReady: boolean
    ) => {
      const normalizedNodeId = identifiers.nodeId?.trim() || null;
      const normalizedBackendNodeId = identifiers.backendNodeId?.trim() || null;
      if (!normalizedNodeId && !normalizedBackendNodeId) return;

      setNodes((nds) =>
        nds.map((node) => {
          const nodeBackendNodeId =
            (node.data?.backendNodeId as string | undefined)?.trim() || null;
          const isTarget =
            (normalizedNodeId !== null && node.id === normalizedNodeId) ||
            (normalizedBackendNodeId !== null && nodeBackendNodeId === normalizedBackendNodeId);

          return isTarget
            ? {
                ...node,
                data: {
                  ...node.data,
                  isProposalDraftReady,
                },
              }
            : node;
        })
      );
    },
    []
  );

  const removeTopicNodeSubtree = useCallback((nodeId: string) => {
    const { edges: currentEdges } = nodesEdgesRef.current;
    const targetIds = new Set<string>([nodeId]);
    const queue = [nodeId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) continue;

      currentEdges.forEach((edge) => {
        if (edge.source === currentId && !targetIds.has(edge.target)) {
          targetIds.add(edge.target);
          queue.push(edge.target);
        }
      });
    }

    setNodes((nds) => nds.filter((n) => !targetIds.has(n.id)));
    setEdges((eds) => eds.filter((e) => !targetIds.has(e.source) && !targetIds.has(e.target)));

    return targetIds;
  }, []);

  const resolvePersistedNodeId = useCallback((node: Node | undefined) => {
    if (!node) return null;

    const backendNodeId = (node.data?.backendNodeId as string | undefined)?.trim();
    if (backendNodeId) return backendNodeId;

    if (node.data?.isTemporaryNode) return null;

    return node.id;
  }, []);

  const resolveFinishTarget = useCallback(
    (nodeId: string) => {
      const { nodes: currentNodes, edges: currentEdges } = nodesEdgesRef.current;
      const node = currentNodes.find((item) => item.id === nodeId);
      if (!node) return { node: null, targetNode: null, backendNodeId: null };

      const directBackendNodeId = resolvePersistedNodeId(node);
      if (directBackendNodeId) {
        return { node, targetNode: node, backendNodeId: directBackendNodeId };
      }

      const explicitParentId = node.data?.parentNodeId as string | undefined;
      const incomingParentId = currentEdges.find((edge) => edge.target === nodeId)?.source;
      const parentNodeId = explicitParentId ?? incomingParentId;
      const parentNode = parentNodeId
        ? currentNodes.find((item) => item.id === parentNodeId)
        : undefined;
      const parentBackendNodeId = resolvePersistedNodeId(parentNode);

      return {
        node,
        targetNode: parentNode ?? null,
        backendNodeId: parentBackendNodeId,
      };
    },
    [resolvePersistedNodeId]
  );

  const upsertExpandedTopicNodeFromBackend = useCallback(
    (
      parentNodeId: string,
      targetNodeId: string,
      backendTopic?: BackendTopic,
      fallbackPrompt?: string
    ) => {
      const { nodes: currentNodes } = nodesEdgesRef.current;
      const parentNode = currentNodes.find((n) => n.id === parentNodeId);
      if (!parentNode) return null;

      console.log('[topic-selection][expand][upsert:start]', {
        parentNodeId,
        targetNodeId,
        backendTopic,
        fallbackPrompt,
      });

      const topicContent = backendTopic
        ? mapBackendTopicToTopicContent(backendTopic)
        : parseSuggestedTextToTopics(fallbackPrompt ?? '')[0];

      if (!topicContent) {
        console.warn('[topic-selection][expand][upsert:empty-result]', {
          parentNodeId,
          targetNodeId,
          backendTopic,
          fallbackPrompt,
        });
        removeTopicNode(targetNodeId);
        return null;
      }

      const nodeId =
        backendTopic?.nodeId ?? backendTopic?.node_id ?? backendTopic?.id ?? targetNodeId;
      const persistedBackendNodeId =
        backendTopic?.nodeId ??
        backendTopic?.node_id ??
        backendTopic?.id ??
        (nodeId !== targetNodeId || !nodeId.startsWith('topic-') ? nodeId : null);
      const historyId = registerHistory({
        nodeId,
        projectId,
        keyword: topicContent.subject,
      });
      const parentDepth = layoutDepthFromNodeData(parentNode.data as Record<string, unknown>);
      const fromMerge = !!(parentNode.data?.fromMerge as boolean);
      const apiExpandDepth = backendTopic?.depth;
      const nextLayoutDepth =
        typeof apiExpandDepth === 'number' && apiExpandDepth > 0 ? apiExpandDepth : parentDepth + 1;

      setNodes((nds) =>
        nds.map((n) =>
          n.id === targetNodeId
            ? {
                ...n,
                id: nodeId,
                data: {
                  ...n.data,
                  label: topicContent.subject,
                  content: topicContent,
                  isTemporaryNode: false,
                  backendNodeId:
                    persistedBackendNodeId ?? (n.data?.backendNodeId as string | undefined),
                  keywords: topicContent.keywords,
                  isNew: false,
                  isLoading: false,
                  showInput: true,
                  depth: nextLayoutDepth,
                  tag: (backendTopic?.label as string) ?? (n.data?.tag as string) ?? '연구확장',
                  fromMerge,
                  historyId,
                  isLastNode: Boolean(backendTopic?.isLastNode ?? backendTopic?.is_last_node),
                  streamStepLabel: undefined,
                  streamStepKey: undefined,
                  streamDetails: undefined,
                },
              }
            : n
        )
      );

      if (nodeId !== targetNodeId) {
        moveTopicNodePosition(projectId, targetNodeId, nodeId);
        replaceSiblingChildId(projectId, targetNodeId, nodeId);
        setEdges((eds) =>
          eds.map((edge) =>
            edge.source === targetNodeId || edge.target === targetNodeId
              ? {
                  ...edge,
                  id:
                    edge.id === `edge-${parentNodeId}-${targetNodeId}`
                      ? `edge-${parentNodeId}-${nodeId}`
                      : edge.id,
                  source: edge.source === targetNodeId ? nodeId : edge.source,
                  target: edge.target === targetNodeId ? nodeId : edge.target,
                }
              : edge
          )
        );
      }

      console.log('[topic-selection][expand][upsert:done]', {
        parentNodeId,
        targetNodeId,
        finalNodeId: nodeId,
        topicContent,
      });
      pendingFitViewIdsRef.current = [parentNodeId, nodeId];
      return {
        nodeId,
        backendNodeId: persistedBackendNodeId,
        content: topicContent,
        label: topicContent.subject,
      };
    },
    [moveTopicNodePosition, projectId, registerHistory, removeTopicNode, replaceSiblingChildId]
  );

  const upsertMergedTopicNodeFromBackend = useCallback(
    (sourceNodes: Node[], targetNodeId: string, backendTopic?: BackendTopic) => {
      const { nodes: currentNodes } = nodesEdgesRef.current;
      const placeholderNode = currentNodes.find((n) => n.id === targetNodeId);
      if (!placeholderNode) return;

      const fallbackContent = mergeTopicContents(
        sourceNodes,
        (n) => n.data?.content as TopicContent | undefined,
        (n) =>
          ((n.data?.content as TopicContent)?.subject ?? (n.data?.label as string) ?? '') as string
      );
      const topicContent = backendTopic
        ? mapBackendTopicToTopicContent(backendTopic)
        : fallbackContent;
      const nodeId =
        backendTopic?.nodeId ?? backendTopic?.node_id ?? backendTopic?.id ?? targetNodeId;
      const baseTags = sourceNodes.flatMap(
        (n) => (n.data?.tags as string[] | undefined) ?? [(n.data?.tag as string) ?? '연구확장']
      );
      const historyId = registerHistory({
        nodeId,
        projectId,
        keyword: topicContent.subject,
      });

      setNodes((nds) =>
        nds.map((n) =>
          n.id === targetNodeId
            ? {
                ...n,
                id: nodeId,
                data: {
                  ...n.data,
                  label: topicContent.subject,
                  content: topicContent,
                  isTemporaryNode: false,
                  backendNodeId:
                    backendTopic?.nodeId ??
                    backendTopic?.node_id ??
                    backendTopic?.id ??
                    (n.data?.backendNodeId as string | undefined),
                  keywords: topicContent.keywords,
                  checked: false,
                  pinned: false,
                  isLoading: false,
                  depth: Math.max(
                    2,
                    (() => {
                      const ad = backendTopic?.depth;
                      if (typeof ad === 'number' && ad > 0) {
                        return ad;
                      }
                      return layoutDepthFromNodeData(n.data as Record<string, unknown>);
                    })()
                  ),
                  tag: (backendTopic?.label as string) ?? '융합',
                  tags: [...new Set([...baseTags, '융합'])],
                  fromMerge: true,
                  historyId,
                  isLastNode: Boolean(backendTopic?.isLastNode ?? backendTopic?.is_last_node),
                  streamStepLabel: undefined,
                  streamStepKey: undefined,
                  streamDetails: undefined,
                },
              }
            : n
        )
      );

      if (nodeId !== targetNodeId) {
        moveTopicNodePosition(projectId, targetNodeId, nodeId);
        replaceSiblingChildId(projectId, targetNodeId, nodeId);
        setEdges((eds) =>
          eds.map((edge) =>
            edge.source === targetNodeId || edge.target === targetNodeId
              ? {
                  ...edge,
                  id: edge.target === targetNodeId ? `edge-${edge.source}-${nodeId}` : edge.id,
                  source: edge.source === targetNodeId ? nodeId : edge.source,
                  target: edge.target === targetNodeId ? nodeId : edge.target,
                }
              : edge
          )
        );
      }

      pendingFitViewIdsRef.current = [...sourceNodes.map((n) => n.id), nodeId];
    },
    [moveTopicNodePosition, projectId, registerHistory, replaceSiblingChildId]
  );

  const getParentNodeIdForExpansion = useCallback((targetNodeId: string) => {
    const { nodes: currentNodes, edges: currentEdges } = nodesEdgesRef.current;
    const targetNode = currentNodes.find((n) => n.id === targetNodeId);
    const explicitParentId = targetNode?.data?.parentNodeId as string | undefined;
    if (explicitParentId) return explicitParentId;
    const incomingEdge = currentEdges.find((edge) => edge.target === targetNodeId);
    return incomingEdge?.source;
  }, []);

  const runExpandStreamForNode = useCallback(
    async (targetNodeId: string, options?: { message?: string }) => {
      const parentNodeId = getParentNodeIdForExpansion(targetNodeId);
      if (!parentNodeId || !projectId) return;

      const parentNode = nodesEdgesRef.current.nodes.find((n) => n.id === parentNodeId);
      if (!parentNode) return;

      const nextDepth = layoutDepthFromNodeData(parentNode.data as Record<string, unknown>) + 1;
      const maxDepth = (parentNode.data?.fromMerge as boolean) ? 5 : 4;

      setNodes((nds) =>
        nds.map((n) =>
          n.id === targetNodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  isNew: false,
                  showInput: false,
                  isLoading: true,
                  streamStepLabel: '연구내용 구체화 중...',
                  streamStepKey: undefined,
                  streamDetails: [],
                },
              }
            : n
        )
      );

      try {
        console.log('[topic-selection][expand][request]', {
          targetNodeId,
          parentNodeId,
          message: options?.message ?? '',
          nextDepth,
          maxDepth,
        });
        await fetchTopicSelectionExpandStream(
          projectId,
          {
            nodeId: parentNodeId,
            message: options?.message ?? '',
            finishAtDepth: nextDepth >= maxDepth,
          },
          {
            onProgress: (step, message) => {
              setTopicNodeStreamProgress(targetNodeId, step, message);
            },
            onThinking: (content) => {
              appendTopicNodeThinking(targetNodeId, content);
            },
            onDone: (data) => {
              const backendTopics =
                data?.topics ?? data?.nodes ?? data?.data?.topics ?? data?.data?.nodes ?? [];
              const backendTopic = backendTopics[0];
              console.log('[topic-selection][expand][done]', {
                targetNodeId,
                parentNodeId,
                data,
                backendTopics,
                backendTopic,
              });
              upsertExpandedTopicNodeFromBackend(
                parentNodeId,
                targetNodeId,
                backendTopic,
                data?.suggestedText ?? data?.data?.suggestedText ?? options?.message ?? ''
              );
              void refresh();
            },
            onError: (msg) => {
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === targetNodeId
                    ? {
                        ...n,
                        data: {
                          ...n.data,
                          isNew: true,
                          showInput: false,
                          isLoading: false,
                          streamStepLabel: undefined,
                          streamStepKey: undefined,
                          streamDetails: undefined,
                        },
                      }
                    : n
                )
              );
              console.error('[topic-selection] expand SSE error:', msg);
            },
          }
        );
      } catch (error) {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === targetNodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    isNew: true,
                    showInput: false,
                    isLoading: false,
                    streamStepLabel: undefined,
                    streamStepKey: undefined,
                    streamDetails: undefined,
                  },
                }
              : n
          )
        );
        console.error('[topic-selection] expand API error:', error);
      }
    },
    [
      appendTopicNodeThinking,
      getParentNodeIdForExpansion,
      projectId,
      refresh,
      setTopicNodeStreamProgress,
      upsertExpandedTopicNodeFromBackend,
    ]
  );

  // ---- generateTopics: 프롬프트 입력 → SSE API 호출 → topic 노드 생성 ----
  //
  // GET /api/v3/projects/{project_id}/topic/start/stream
  // SSE 이벤트: progress, thinking, chat(필드 단위 스트리밍), done, error
  // chat/done 누적으로 topic 노드 생성
  //

  useEffect(() => {
    const handler = async (event: Event) => {
      const { prompt, mode } = (
        event as CustomEvent<{
          prompt: string;
          mode?: 'opportunity_exploration' | 'concretization';
        }>
      ).detail;

      const inputNode = nodesEdgesRef.current.nodes.find((n) => n.type === 'prompt');
      if (!inputNode || !projectId) return;

      setNodes((nds) =>
        nds.map((n) =>
          n.type === 'prompt'
            ? {
                ...n,
                data: {
                  ...n.data,
                  isLoading: true,
                  hasCompleted: false,
                  streamStepLabel: undefined,
                  streamStepKey: undefined,
                  streamDetails: [],
                },
              }
            : n
        )
      );

      try {
        await fetchTopicSelectionStartStream(projectId, prompt, mode ?? 'opportunity_exploration', {
          onProgress: (step, message) => {
            setNodes((nds) =>
              nds.map((n) => {
                if (n.type !== 'prompt') return n;
                const prevDetails = (n.data?.streamDetails as string[] | undefined) ?? [];
                const nextMessage = (() => {
                  const trimmedStep = step?.trim();
                  const trimmedMessage = message?.trim();
                  if (trimmedStep && trimmedMessage && trimmedStep !== trimmedMessage) {
                    return `${trimmedStep}: ${trimmedMessage}`;
                  }
                  return trimmedMessage || trimmedStep || '';
                })();
                const nextDetails =
                  nextMessage && prevDetails[prevDetails.length - 1] !== nextMessage
                    ? [...prevDetails, nextMessage]
                    : prevDetails;
                return {
                  ...n,
                  data: {
                    ...n.data,
                    streamStepKey: step ?? (n.data?.streamStepKey as string | undefined),
                    streamStepLabel: nextMessage || undefined,
                    streamDetails: nextDetails,
                  },
                };
              })
            );
          },
          onThinking: () => {},
          onChat: (topics) => {
            upsertTopicNodesFromBackend(topics, { complete: false });
          },
          onDone: (data) => {
            const backendTopics = data?.topics ?? data?.data?.topics ?? [];
            upsertTopicNodesFromBackend(backendTopics, {
              complete: true,
              fallbackPrompt: data?.suggestedText ?? data?.data?.suggestedText ?? prompt,
            });
            void refresh();
          },
          onError: (msg) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.type === 'prompt'
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        isLoading: false,
                        streamStepLabel: undefined,
                        streamStepKey: undefined,
                        streamDetails: undefined,
                      },
                    }
                  : n
              )
            );
            console.error('[topic-selection] SSE error:', msg);
          },
        });
      } catch (err) {
        setNodes((nds) =>
          nds.map((n) =>
            n.type === 'prompt'
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    isLoading: false,
                    streamStepLabel: undefined,
                    streamStepKey: undefined,
                    streamDetails: undefined,
                  },
                }
              : n
          )
        );
        console.error('[topic-selection] API error:', err);
      }
    };
    window.addEventListener('generateTopics', handler);
    return () => window.removeEventListener('generateTopics', handler);
  }, [projectId, refresh, upsertTopicNodesFromBackend]);

  // ---- asidebarEnhanceSend: 주제 보강 → 하위 노드 생성 ----

  useEffect(() => {
    const handler = (event: Event) => {
      const { nodeId, message } = (event as CustomEvent<{ nodeId: string; message: string }>)
        .detail;
      const selectedNode = nodes.find((n) => n.id === nodeId);
      if (!selectedNode) return;

      const refinedTopics = refineTopic(nodeId, message);
      const newDepth = layoutDepthFromNodeData(selectedNode.data as Record<string, unknown>) + 1;
      const newX = INPUT_NODE_X + newDepth * NODE_OFFSET_X;
      const sourceY = selectedNode.position?.y ?? 0;
      const fromMerge = !!(selectedNode.data?.fromMerge as boolean);

      const newNodes: Node[] = refinedTopics.map((topic, index) => {
        const newNodeId = `topic-${nodeIdRef.current++}`;
        return {
          id: newNodeId,
          type: 'topic',
          position: {
            x: newX,
            y: sourceY + (index - (refinedTopics.length - 1) / 2) * NODE_OFFSET_Y,
          },
          data: {
            label: topic,
            checked: false,
            pinned: false,
            isTemporaryNode: true,
            depth: newDepth,
            tag: '연구확장',
            fromMerge,
          },
        };
      });

      const newEdges: Edge[] = newNodes.map((n) => ({
        id: `edge-${nodeId}-${n.id}`,
        source: nodeId,
        target: n.id,
        ...defaultEdgeOptions,
      }));

      setNodes((nds) => [...nds, ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);
    };
    window.addEventListener('asidebarEnhanceSend', handler);
    return () => window.removeEventListener('asidebarEnhanceSend', handler);
  }, [nodes]);

  // ---- 노드 체크 / 핀 상태 변경 ----

  useEffect(() => {
    const handler = (event: Event) => {
      const { id, checked } = (event as CustomEvent<{ id: string; checked: boolean }>).detail;
      setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, checked } } : n)));
    };
    window.addEventListener('nodeCheckChange', handler);
    return () => window.removeEventListener('nodeCheckChange', handler);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const { id, pinned } = (event as CustomEvent<{ id: string; pinned: boolean }>).detail;
      setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, pinned } } : n)));
    };
    window.addEventListener('nodePinChange', handler);
    return () => window.removeEventListener('nodePinChange', handler);
  }, []);

  // ---- nodeSubmitHypothesis: 새 노드 가설 입력 → API 호출 (주제구체화) ----

  useEffect(() => {
    const handler = async (event: Event) => {
      const { id: nodeId, prompt } = (event as CustomEvent<{ id: string; prompt: string }>).detail;
      await runExpandStreamForNode(nodeId, { message: prompt });
    };
    window.addEventListener('nodeSubmitHypothesis', handler);
    return () => window.removeEventListener('nodeSubmitHypothesis', handler);
  }, [runExpandStreamForNode]);

  // ---- nodeAutoConcretize: 자동구체화 (입력 없이 노드 컨텍스트로 생성) ----

  useEffect(() => {
    const handler = async (event: Event) => {
      const { nodeId } = (event as CustomEvent<{ nodeId: string }>).detail;
      await runExpandStreamForNode(nodeId);
    };
    window.addEventListener('nodeAutoConcretize', handler);
    return () => window.removeEventListener('nodeAutoConcretize', handler);
  }, [runExpandStreamForNode]);

  // ---- addNodeFromTopic: + 버튼 → 오른쪽에 새 노드 추가 ----

  useEffect(() => {
    const handler = (event: Event) => {
      const { nodeId: sourceNodeId } = (event as CustomEvent<{ nodeId: string }>).detail;
      const sourceNode = nodes.find((n) => n.id === sourceNodeId);
      if (!sourceNode) return;

      const newDepth = layoutDepthFromNodeData(sourceNode.data as Record<string, unknown>) + 1;
      const fromMerge = !!(sourceNode.data?.fromMerge as boolean);
      const nodeId = `topic-${nodeIdRef.current++}`;
      const newNode: Node = {
        id: nodeId,
        type: 'topic',
        position: { x: INPUT_NODE_X + newDepth * NODE_OFFSET_X, y: sourceNode.position?.y ?? 0 },
        data: {
          label: '',
          checked: false,
          pinned: false,
          isTemporaryNode: true,
          isNew: true,
          isLoading: false,
          depth: newDepth,
          tag: '연구확장',
          fromMerge,
          parentNodeId: sourceNodeId,
        },
      };
      const newEdge: Edge = {
        id: `edge-${sourceNode.id}-${newNode.id}`,
        source: sourceNode.id,
        target: newNode.id,
        ...defaultEdgeOptions,
      };
      setNodes((nds) => [...nds, newNode]);
      setEdges((eds) => [...eds, newEdge]);
    };
    window.addEventListener('addNodeFromTopic', handler);
    return () => window.removeEventListener('addNodeFromTopic', handler);
  }, [nodes]);

  // ---- nodeDelete ----

  useEffect(() => {
    const handler = async (event: Event) => {
      const { id } = (event as CustomEvent<{ id: string }>).detail;
      const node = nodesEdgesRef.current.nodes.find((item) => item.id === id);
      const persistedNodeId = resolvePersistedNodeId(node);

      if (!persistedNodeId) {
        markNodeDeleted(id);
        removeTopicNodeSubtree(id);
        return;
      }

      try {
        await deleteNode(persistedNodeId);
        clearProposalDraftReady(projectId, persistedNodeId);
        markNodeDeleted(id);
        await refresh();
      } catch (error) {
        console.error('[topic-selection] delete node API error:', error);
      }
    };
    window.addEventListener('nodeDelete', handler);
    return () => window.removeEventListener('nodeDelete', handler);
  }, [
    clearProposalDraftReady,
    deleteNode,
    markNodeDeleted,
    projectId,
    refresh,
    removeTopicNodeSubtree,
    resolvePersistedNodeId,
  ]);

  // ---- nodeRefresh: 개별 노드 새로고침 ----

  useEffect(() => {
    const handler = async (event: Event) => {
      const { id: nodeId } = (event as CustomEvent<{ id: string }>).detail;
      const node = nodes.find((n) => n.id === nodeId);
      if (!node?.data?.label) return;

      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, isLoading: true } } : n))
      );
      try {
        const result = await generateHypothesis(node.data.label as string);
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    label: result.label,
                    content: result.content,
                    keywords: result.content.keywords,
                    isLoading: false,
                  },
                }
              : n
          )
        );
      } catch {
        setNodes((nds) =>
          nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, isLoading: false } } : n))
        );
      }
    };
    window.addEventListener('nodeRefresh', handler);
    return () => window.removeEventListener('nodeRefresh', handler);
  }, [nodes]);

  // ---- nodeTopicSelect: 건축 주제선정 → finish SSE API ----

  useEffect(() => {
    const handler = async (event: Event) => {
      const { nodeId, prompt: inputPrompt } = (
        event as CustomEvent<{ nodeId: string; prompt?: string }>
      ).detail;
      const { nodes: currentNodes, edges: currentEdges } = nodesEdgesRef.current;
      const initialNode = currentNodes.find((item) => item.id === nodeId);
      if (!initialNode) return;

      let prompt = (inputPrompt ?? '').trim();
      if (!prompt) {
        const content = initialNode.data?.content as TopicContent | undefined;
        const label = (initialNode.data?.label as string) ?? '';
        prompt = (content?.subject ?? label).trim();
      }
      if (!prompt) {
        const incomingEdge = currentEdges.find((e) => e.target === nodeId);
        const parentNode = incomingEdge
          ? currentNodes.find((n) => n.id === incomingEdge.source)
          : undefined;
        const parentContent = parentNode?.data?.content as TopicContent | undefined;
        const parentLabel = (parentNode?.data?.label as string) ?? '';
        prompt = (parentContent?.subject ?? parentLabel).trim();
      }
      if (!prompt) prompt = '건축 주제';

      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  isTopicSelecting: true,
                  isLoading: false,
                  topicSelected: false,
                  showInput: true,
                  streamStepLabel: '토픽을 기반으로 최종 목표와 연구개발 내용을 정리하는 중...',
                  streamStepKey: undefined,
                  streamDetails: [],
                },
              }
            : n
        )
      );
      try {
        const activeNodeId = nodeId;
        let activeNode = initialNode;
        let activeContent = activeNode.data?.content as TopicContent | undefined;
        let activeLabel = (activeNode.data?.label as string) ?? '';
        let activeBackendNodeId = resolvePersistedNodeId(activeNode);

        if (!activeBackendNodeId) {
          const {
            node: resolvedNode,
            targetNode,
            backendNodeId,
          } = resolveFinishTarget(activeNodeId);
          const finishSourceNode = targetNode ?? resolvedNode;
          activeNode = resolvedNode ?? activeNode;
          activeContent =
            (finishSourceNode?.data?.content as TopicContent | undefined) ?? activeContent;
          activeLabel = ((finishSourceNode?.data?.label as string) ?? activeLabel).trim();
          activeBackendNodeId = backendNodeId;
        }

        if (!activeBackendNodeId) {
          throw new Error(`finish API에 사용할 backend topic id가 없습니다: ${nodeId}`);
        }
        await fetchTopicSelectionFinishStream(
          projectId,
          { nodeId: activeBackendNodeId, mode: 'finish', id: activeNodeId },
          {
            onProgress: (step, message) => {
              setTopicNodeStreamProgress(activeNodeId, step, message);
            },
            onThinking: (thinking) => {
              appendTopicNodeThinking(activeNodeId, thinking);
            },
            onDone: (data) => {
              clearProposalDraftReady(projectId, activeBackendNodeId);
              const finishTopic = mapFinishDoneDataToBackendTopic(data);
              const nextContent = finishTopic
                ? mapBackendTopicToTopicContent(finishTopic)
                : activeContent;
              const fallbackSelectedContent = {
                finalObjective: prompt,
                researchContent: nextContent?.methodology ?? activeContent?.methodology ?? '',
                expectedEffectAndPlan:
                  nextContent?.expectedEffect ?? activeContent?.expectedEffect ?? '',
              };
              const selectedContent = mapFinishDoneDataToSelectedContent(
                data,
                fallbackSelectedContent
              );
              const subject =
                (nextContent?.subject ?? activeContent?.subject ?? activeLabel ?? prompt).trim() ||
                '건축 주제';
              const nextNodeId = finishTopic?.id?.trim() || activeNodeId;
              const nextBackendNodeId = finishTopic?.id?.trim() || activeBackendNodeId;
              const nextDepth =
                typeof finishTopic?.depth === 'number' && finishTopic.depth > 0
                  ? finishTopic.depth
                  : layoutDepthFromNodeData(initialNode.data as Record<string, unknown>) + 1;
              const fromApiParent = (
                finishTopic?.parentNodeId ??
                finishTopic?.parent_node_id ??
                ''
              ).trim();
              const fromLocalParent = (
                (initialNode.data?.parentNodeId as string | undefined) ?? ''
              ).trim();
              const fromEdgeParent = (
                nodesEdgesRef.current.edges.find((e) => e.target === activeNodeId)?.source ?? ''
              ).trim();
              const nextParentNodeId =
                fromLocalParent || fromEdgeParent || fromApiParent || TOPIC_PROMPT_NODE_ID;
              const nextIsLastNode = true;
              const historyId = registerHistory({
                nodeId: nextNodeId,
                projectId,
                keyword: subject,
              });
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === activeNodeId
                    ? {
                        ...n,
                        id: nextNodeId,
                        data: {
                          ...n.data,
                          isTopicSelecting: false,
                          topicSelected: true,
                          selectedContent,
                          isProposalCreating: false,
                          isProposalDraftReady: false,
                          backendNodeId: nextBackendNodeId,
                          isTemporaryNode: false,
                          label: subject,
                          content: nextContent ?? n.data?.content,
                          keywords:
                            nextContent?.keywords ??
                            (n.data?.keywords as string[] | undefined) ??
                            [],
                          isNew: false,
                          isLoading: false,
                          showInput: false,
                          historyId,
                          depth: nextDepth,
                          parentNodeId: nextParentNodeId,
                          isLastNode: nextIsLastNode,
                          streamStepLabel: undefined,
                          streamStepKey: undefined,
                          streamDetails: undefined,
                        },
                      }
                    : n
                )
              );
              if (nextNodeId !== activeNodeId) {
                moveTopicNodePosition(projectId, activeNodeId, nextNodeId);
                replaceSiblingChildId(projectId, activeNodeId, nextNodeId);
                setEdges((eds) =>
                  eds.map((edge) => ({
                    ...edge,
                    id:
                      edge.id === `edge-${edge.source}-${activeNodeId}`
                        ? `edge-${edge.source}-${nextNodeId}`
                        : edge.id,
                    source: edge.source === activeNodeId ? nextNodeId : edge.source,
                    target: edge.target === activeNodeId ? nextNodeId : edge.target,
                  }))
                );
              }
              pendingFitViewIdsRef.current = [nextNodeId];
              void refresh();
            },
            onError: (msg) => {
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === activeNodeId
                    ? {
                        ...n,
                        data: {
                          ...n.data,
                          isTopicSelecting: false,
                          isLoading: false,
                          showInput: true,
                          streamStepLabel: undefined,
                          streamStepKey: undefined,
                          streamDetails: undefined,
                        },
                      }
                    : n
                )
              );
              console.error('[topic-selection] finish SSE error:', msg);
            },
          }
        );
      } catch (error) {
        console.error('[topic-selection] finish API error:', error);
        try {
          const content = initialNode.data?.content as TopicContent | undefined;
          const { subject, body } = await summarizeTopicForSelection(prompt, content);
          const historyId = registerHistory({ nodeId, projectId, keyword: subject });
          const { backendNodeId: fallbackBackendId } = resolveFinishTarget(nodeId);
          setNodes((nds) =>
            nds.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      isTopicSelecting: false,
                      topicSelected: true,
                      selectedContent: body,
                      isProposalCreating: false,
                      isProposalDraftReady: false,
                      isTemporaryNode: false,
                      ...(fallbackBackendId ? { backendNodeId: fallbackBackendId } : {}),
                      label: subject,
                      isNew: false,
                      isLoading: false,
                      showInput: false,
                      historyId,
                      isLastNode: true,
                      streamStepLabel: undefined,
                      streamStepKey: undefined,
                      streamDetails: undefined,
                    },
                  }
                : n
            )
          );
        } catch {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      isTopicSelecting: false,
                      isLoading: false,
                      showInput: true,
                      streamStepLabel: undefined,
                      streamStepKey: undefined,
                      streamDetails: undefined,
                    },
                  }
                : n
            )
          );
        }
      }
    };
    window.addEventListener('nodeTopicSelect', handler);
    return () => window.removeEventListener('nodeTopicSelect', handler);
  }, [
    appendTopicNodeThinking,
    clearProposalDraftReady,
    moveTopicNodePosition,
    projectId,
    refresh,
    registerHistory,
    replaceSiblingChildId,
    resolveFinishTarget,
    resolvePersistedNodeId,
    setTopicNodeStreamProgress,
  ]);

  // ---- nodeRefineAgain: 다시 구체화 (입력 영역 복원) ----

  useEffect(() => {
    const handler = (event: Event) => {
      const { nodeId } = (event as CustomEvent<{ nodeId: string }>).detail;
      const node = nodesEdgesRef.current.nodes.find((item) => item.id === nodeId);
      const persistedNodeId = resolvePersistedNodeId(node);
      if (projectId && persistedNodeId) {
        clearProposalDraftReady(projectId, persistedNodeId);
      }
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  topicSelected: false,
                  showInput: true,
                  isProposalCreating: false,
                  isProposalDraftReady: false,
                },
              }
            : n
        )
      );
    };
    window.addEventListener('nodeRefineAgain', handler);
    return () => window.removeEventListener('nodeRefineAgain', handler);
  }, [clearProposalDraftReady, projectId, resolvePersistedNodeId]);

  // ---- nodeGoToResearchPlan: 건축 제안서 작성으로 이동 ----

  useEffect(() => {
    const handler = async (event: Event) => {
      const { nodeId, mode = 'fast' } = (
        event as CustomEvent<{ nodeId: string; mode?: 'fast' | 'slow' }>
      ).detail;
      if (!projectId) return;

      const node = nodesEdgesRef.current.nodes.find((item) => item.id === nodeId);
      const persistedFromNode = resolvePersistedNodeId(node);
      const { backendNodeId: finishBackendId } = resolveFinishTarget(nodeId);
      const resolvedNodeId = persistedFromNode ?? finishBackendId ?? null;
      if (!resolvedNodeId) {
        console.warn(
          '[topic-selection] 건축 제안서 초안: 서버에 등록된 토픽 노드 ID를 찾을 수 없습니다.',
          { nodeId, hasNode: Boolean(node) }
        );
        return;
      }

      console.info('[topic-selection] 건축 제안서 초안생성 클릭', {
        clickedNodeId: nodeId,
        resolvedNodeId,
        proposalMode: mode,
        apiVersion: mode === 'slow' ? 'v2' : 'v3',
        projectId,
        hasDraftReady: Boolean(node?.data?.isProposalDraftReady),
      });

      if (node?.data?.isProposalDraftReady) {
        router.push(
          `/projects/${projectId}/research-plan?sessionId=${RESEARCH_PLAN_SESSION_ID}&nodeId=${encodeURIComponent(
            resolvedNodeId
          )}`
        );
        return;
      }

      setProposalCreatingState({ nodeId, backendNodeId: resolvedNodeId }, true);

      try {
        console.info('[topic-selection] proposal create stream 호출 직전', {
          apiVersion: mode === 'slow' ? 'v2' : 'v3',
          projectId,
          nodeId: resolvedNodeId,
          sessionId: RESEARCH_PLAN_SESSION_ID,
        });
        const result = await fetchProposalCreateStream(
          projectId,
          {
            nodeId: resolvedNodeId,
            sessionId: RESEARCH_PLAN_SESSION_ID,
            apiVersion: mode === 'slow' ? 'v2' : 'v3',
          },
          {}
        );

        console.info('[topic-selection] proposal create stream 완료', {
          projectId,
          nodeId: resolvedNodeId,
          hasResult: Boolean(result),
          chatCount: result?.chat?.length ?? 0,
        });

        const draft = getProposalDraftFromDoneData(result);
        initializeProposalDraft({
          projectId,
          draft: draft || useResearchPlanStore.getState().draft,
          messages: (result?.chat ?? [])
            .filter((item) => item.role === 'assistant' || item.role === 'user')
            .map((item) => ({
              role: item.role ?? 'assistant',
              content: item.content ?? '',
            })),
          sessionId: RESEARCH_PLAN_SESSION_ID,
          sourceNodeId: resolvedNodeId,
        });
        markProposalDraftReady(projectId, resolvedNodeId);
        setProposalDraftReadyState({ nodeId, backendNodeId: resolvedNodeId }, true);
      } catch (error) {
        console.error('[topic-selection] proposal create API error:', error);
      } finally {
        setProposalCreatingState({ nodeId, backendNodeId: resolvedNodeId }, false);
      }
    };
    window.addEventListener('nodeGoToResearchPlan', handler);
    return () => window.removeEventListener('nodeGoToResearchPlan', handler);
  }, [
    initializeProposalDraft,
    markProposalDraftReady,
    projectId,
    resolveFinishTarget,
    resolvePersistedNodeId,
    router,
    setProposalCreatingState,
    setProposalDraftReadyState,
  ]);

  // ---- depthAdd / depthRefresh ----

  const handleDepthAdd = useCallback(async () => {
    if (!projectId) return;

    const { nodes: currentNodes } = nodesEdgesRef.current;
    const promptNode = currentNodes.find((node) => node.type === 'prompt');
    if (!promptNode) return;

    const depthOneNodes = currentNodes.filter(
      (node) =>
        node.type === 'topic' && layoutDepthFromNodeData(node.data as Record<string, unknown>) === 1
    );
    const bottomNode = depthOneNodes.reduce<Node | null>((acc, node) => {
      if (!acc) return node;
      return (acc.position?.y ?? 0) > (node.position?.y ?? 0) ? acc : node;
    }, null);

    const placeholderId = `topic-${nodeIdRef.current++}`;
    const placeholderNode: Node = {
      id: placeholderId,
      type: 'topic',
      position: {
        x: INPUT_NODE_X + NODE_OFFSET_X,
        y: bottomNode ? (bottomNode.position?.y ?? INPUT_NODE_Y) + NODE_OFFSET_Y : INPUT_NODE_Y,
      },
      data: {
        label: '',
        checked: false,
        pinned: false,
        isTemporaryNode: true,
        isLoading: true,
        depth: 1,
        tag: '연구확장',
        streamStepLabel: '새 주제 추가 중...',
        streamStepKey: 'topic_node',
        streamDetails: [],
      },
    };

    const placeholderEdge: Edge = {
      id: `edge-${promptNode.id}-${placeholderId}`,
      source: promptNode.id,
      target: placeholderId,
      ...defaultEdgeOptions,
    };

    setNodes((nds) => [...nds, placeholderNode]);
    setEdges((eds) => [...eds, placeholderEdge]);

    try {
      await fetchTopicSelectionGenerateStream(
        projectId,
        { mode: 'add' },
        {
          onProgress: (step, message) => {
            setTopicNodeStreamProgress(placeholderId, step, message);
          },
          onThinking: (content) => {
            appendTopicNodeThinking(placeholderId, content);
          },
          onDone: () => {
            // 서버가 새 노드(UUID)를 내려주므로 로컬 플레이스홀더를 남기면 병합 시 노드가 둘로 보임
            removeTopicNode(placeholderId);
            void refresh();
          },
          onError: (msg) => {
            removeTopicNode(placeholderId);
            console.error('[topic-selection] depth add SSE error:', msg);
          },
        }
      );
    } catch (error) {
      removeTopicNode(placeholderId);
      console.error('[topic-selection] depth add API error:', error);
    } finally {
      clearTopicNodeStreamState([placeholderId]);
    }
  }, [
    appendTopicNodeThinking,
    clearTopicNodeStreamState,
    projectId,
    refresh,
    removeTopicNode,
    setTopicNodeStreamProgress,
  ]);

  const handleDepthRefresh = useCallback(async () => {
    if (!projectId) return;

    const { nodes: currentNodes } = nodesEdgesRef.current;
    const depthOneNodes = currentNodes.filter(
      (node) =>
        node.type === 'topic' && layoutDepthFromNodeData(node.data as Record<string, unknown>) === 1
    );
    const pinnedNodes = depthOneNodes.filter((node) => Boolean(node.data?.pinned));
    const refreshTargets = depthOneNodes.filter((node) => !node.data?.pinned);

    if (refreshTargets.length === 0) return;

    const targetIds = refreshTargets.map((node) => node.id);
    setNodes((nds) =>
      nds.map((node) =>
        targetIds.includes(node.id)
          ? {
              ...node,
              data: {
                ...node.data,
                isLoading: true,
                streamStepLabel: '노드 새로고침 중...',
                streamStepKey: 'topic_node',
                streamDetails: [],
              },
            }
          : node
      )
    );

    try {
      await fetchTopicSelectionGenerateStream(
        projectId,
        {
          mode: 'refresh',
          nodeIds: pinnedNodes
            .map((node) => resolvePersistedNodeId(node))
            .filter((nodeId): nodeId is string => Boolean(nodeId)),
          reasoning: 'high',
        },
        {
          onProgress: (step, message) => {
            targetIds.forEach((nodeId) => {
              setTopicNodeStreamProgress(nodeId, step, message);
            });
          },
          onThinking: (content) => {
            targetIds.forEach((nodeId) => {
              appendTopicNodeThinking(nodeId, content);
            });
          },
          onDone: () => {
            void refresh();
          },
          onError: (msg) => {
            clearTopicNodeStreamState(targetIds);
            console.error('[topic-selection] depth refresh SSE error:', msg);
          },
        }
      );
    } catch (error) {
      console.error('[topic-selection] depth refresh API error:', error);
    } finally {
      clearTopicNodeStreamState(targetIds);
    }
  }, [
    appendTopicNodeThinking,
    clearTopicNodeStreamState,
    projectId,
    refresh,
    resolvePersistedNodeId,
    setTopicNodeStreamProgress,
  ]);

  useEffect(() => {
    const handler = (event: Event) => {
      void (event as CustomEvent<{ depth: number; nodeId: string }>).detail;
      void handleDepthAdd();
    };
    window.addEventListener('depthAdd', handler);
    return () => window.removeEventListener('depthAdd', handler);
  }, [handleDepthAdd]);

  useEffect(() => {
    const handler = (event: Event) => {
      void (event as CustomEvent<{ depth: number }>).detail;
      void handleDepthRefresh();
    };
    window.addEventListener('depthRefresh', handler);
    return () => window.removeEventListener('depthRefresh', handler);
  }, [handleDepthRefresh]);

  // ---- 체크된 노드 & 병합 ----

  const checkedTopicNodes = nodes.filter((n) => n.type === 'topic' && (n.data?.checked as boolean));
  const checkedDepth1Nodes = checkedTopicNodes.filter(
    (n) => layoutDepthFromNodeData(n.data as Record<string, unknown>) === 1
  );
  const canMerge = checkedDepth1Nodes.length >= 2;

  const handleMergeTopics = useCallback(async () => {
    if (!canMerge || !projectId || isMergingTopics) return;
    const toMerge = checkedDepth1Nodes;
    const avgY = toMerge.reduce((acc, n) => acc + (n.position?.y ?? 0), 0) / toMerge.length;
    const mergedContent = mergeTopicContents(
      toMerge,
      (n) => n.data?.content as TopicContent | undefined,
      (n) =>
        ((n.data?.content as TopicContent)?.subject ?? (n.data?.label as string) ?? '') as string
    );
    const baseTags = toMerge.flatMap(
      (n) => (n.data?.tags as string[] | undefined) ?? [(n.data?.tag as string) ?? '연구확장']
    );
    const mergedDepth = 2; // 합쳐진 노드는 Depth 2

    const placeholderNodeId = `topic-${nodeIdRef.current++}`;
    const mergedNode: Node = {
      id: placeholderNodeId,
      type: 'topic',
      position: { x: INPUT_NODE_X + mergedDepth * NODE_OFFSET_X, y: avgY - 70 },
      data: {
        label: '융합 연구',
        content: mergedContent,
        keywords: mergedContent.keywords,
        checked: false,
        pinned: false,
        isTemporaryNode: true,
        isLoading: true,
        depth: mergedDepth,
        tag: '연구합치기',
        tags: [...new Set([...baseTags, '연구합치기'])],
        fromMerge: true,
        streamStepLabel: '노드 융합 중...',
        streamStepKey: undefined,
        streamDetails: [],
      },
    };

    const newEdges: Edge[] = toMerge.map((src) => ({
      id: `edge-${src.id}-${placeholderNodeId}`,
      source: src.id,
      target: placeholderNodeId,
      ...solidEdgeOptions,
    }));

    setNodes((nds) => [
      ...nds.map((n) =>
        toMerge.some((s) => s.id === n.id) ? { ...n, data: { ...n.data, checked: false } } : n
      ),
      mergedNode,
    ]);
    setEdges((eds) => [...eds, ...newEdges]);
    pendingFitViewIdsRef.current = [...toMerge.map((s) => s.id), placeholderNodeId];
    setIsMergingTopics(true);

    try {
      await fetchTopicSelectionMergeStream(
        projectId,
        { nodeIds: toMerge.map((node) => node.id) },
        {
          onProgress: (step, message) => {
            setTopicNodeStreamProgress(placeholderNodeId, step, message);
          },
          onThinking: (content) => {
            appendTopicNodeThinking(placeholderNodeId, content);
          },
          onDone: (data) => {
            const backendTopics =
              data?.topics ?? data?.nodes ?? data?.data?.topics ?? data?.data?.nodes ?? [];
            upsertMergedTopicNodeFromBackend(toMerge, placeholderNodeId, backendTopics[0]);
            void refresh();
          },
          onError: (msg) => {
            removeTopicNode(placeholderNodeId);
            setNodes((nds) =>
              nds.map((n) =>
                toMerge.some((sourceNode) => sourceNode.id === n.id)
                  ? { ...n, data: { ...n.data, checked: true } }
                  : n
              )
            );
            console.error('[topic-selection] merge SSE error:', msg);
          },
        }
      );
    } catch (error) {
      removeTopicNode(placeholderNodeId);
      setNodes((nds) =>
        nds.map((n) =>
          toMerge.some((sourceNode) => sourceNode.id === n.id)
            ? { ...n, data: { ...n.data, checked: true } }
            : n
        )
      );
      console.error('[topic-selection] merge API error:', error);
    } finally {
      setIsMergingTopics(false);
    }
  }, [
    appendTopicNodeThinking,
    canMerge,
    checkedDepth1Nodes,
    isMergingTopics,
    projectId,
    refresh,
    removeTopicNode,
    setTopicNodeStreamProgress,
    upsertMergedTopicNodeFromBackend,
  ]);

  // ---- lastNodeIdPerDepth (DepthControlsContext용) ----

  const lastNodeIdPerDepth = useMemo(() => {
    const byDepth = new Map<number, Node[]>();
    for (const n of nodes) {
      if (n.type !== 'topic') continue;
      const d = layoutDepthFromNodeData(n.data as Record<string, unknown>);
      if (!byDepth.has(d)) byDepth.set(d, []);
      byDepth.get(d)!.push(n);
    }
    const result = new Map<number, string>();
    for (const [d, list] of byDepth) {
      const bottom = list.reduce((a, b) => ((a.position?.y ?? 0) > (b.position?.y ?? 0) ? a : b));
      result.set(d, bottom.id);
    }
    return result;
  }, [nodes]);

  const depthControlsValue = useMemo(
    () => ({ lastNodeIdPerDepth, onDepthAdd: handleDepthAdd, onDepthRefresh: handleDepthRefresh }),
    [lastNodeIdPerDepth, handleDepthAdd, handleDepthRefresh]
  );

  // ---- 렌더 ----

  if (!isClient || !topicLayoutHydrated || (projectId && isInitialLoad)) {
    return (
      <div className='relative h-full min-h-[calc(100vh-140px)] w-full bg-zinc-100 flex items-center justify-center'>
        <div className='text-zinc-500'>Loading...</div>
      </div>
    );
  }

  if (projectId && isError) {
    return (
      <div className='relative h-full min-h-[calc(100vh-140px)] w-full bg-zinc-100 flex items-center justify-center'>
        <div className='text-center text-zinc-600'>
          <p>건축 주제 선정을 불러올 수 없습니다.</p>
          <p className='mt-2 text-sm text-zinc-500'>
            API 주소(NEXT_PUBLIC_API_URL)와 네트워크 연결을 확인해 주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DepthControlsContext.Provider value={depthControlsValue}>
      <div className='flex h-full min-h-0 flex-col'>
        <PageHeader
          title='연구계획초안 생성'
          description='건축 주제를 탐색하고 구체화하세요. 노드를 확장하여 건축 방향을 세분화할 수 있습니다.'
        />
        <div className='relative min-h-0 flex-1 w-full bg-zinc-100'>
          {/* 우상단 저장 툴바 */}
          <div className='absolute right-4 top-4 z-40 flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 shadow-sm'>
            <button
              type='button'
              onClick={async () => {
                try {
                  if (projectId) {
                    await deleteAllNodes();
                    clearProjectProposalDraftReady(projectId);
                    clearSiblingOrdersProject(projectId);
                  }
                  setNodes(defaultState.nodes);
                  setEdges(defaultState.edges);
                  nodeIdRef.current = defaultState.nodeIdRef;
                } catch (error) {
                  console.error('[topic-selection] delete all nodes API error:', error);
                }
              }}
              title='새 문서 (초기화)'
              disabled={isDeletingAll}
              className='flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {isDeletingAll ? (
                <Loader2 className='size-4 animate-spin' />
              ) : (
                <FilePlus className='size-4' />
              )}
            </button>
          </div>

          <ReactFlow
            className='h-full'
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={(instance) => {
              reactFlowRef.current = instance;
            }}
            onNodeDragStop={(_, node) => {
              if (!projectId || node.type !== 'topic') return;
              const prev = useTopicLayoutStore.getState().positionsByProject[projectId] ?? {};
              setProjectTopicPositions(projectId, {
                ...prev,
                [node.id]: { x: node.position.x, y: node.position.y },
              });
            }}
            nodeTypes={nodeTypes}
            fitView
            nodesDraggable
            nodesConnectable
            defaultEdgeOptions={defaultEdgeOptions}
            zoomOnScroll={false}
            zoomActivationKeyCode='Control'
            noWheelClassName='topic-node-scroll'
            noDragClassName='noDrag add-node-btn'
            noPanClassName='add-node-btn'
          >
            <Background color='rgba(148,163,184,0.2)' gap={24} size={1} />
            <Controls className='!bg-white !border-zinc-200 [&>button]:!bg-white [&>button]:!text-zinc-600 [&>button]:!border-zinc-200 [&>button]:hover:!bg-zinc-50' />
            <MiniMap
              nodeColor='#e2e8f0'
              nodeStrokeColor='transparent'
              maskColor='rgba(0,0,0,0.08)'
              className='!border-zinc-200 !bg-white'
            />
          </ReactFlow>

          {/* 하단 플로팅 메뉴 (노드 체크 시 표시) */}
          {checkedTopicNodes.length >= 1 && (
            <div className='absolute bottom-6 left-1/2 z-40 flex -translate-x-1/2 gap-2 rounded-lg border border-zinc-200 bg-white px-2 py-2 shadow-lg'>
              <button
                type='button'
                onClick={handleMergeTopics}
                disabled={!canMerge || isMergingTopics}
                className='rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500'
              >
                {isMergingTopics ? '연구합치는 중...' : '연구합치기'}
              </button>
              <button
                type='button'
                onClick={async () => {
                  const selectedNodes = checkedTopicNodes;
                  const selectedIds = new Set(selectedNodes.map((node) => node.id));
                  const localOnlyIds = selectedNodes
                    .filter((node) => !resolvePersistedNodeId(node))
                    .map((node) => node.id);
                  const persistedIds = selectedNodes
                    .map((node) => resolvePersistedNodeId(node))
                    .filter((nodeId): nodeId is string => Boolean(nodeId));

                  localOnlyIds.forEach((id) => {
                    markNodeDeleted(id);
                    removeTopicNodeSubtree(id);
                  });

                  if (persistedIds.length === 0) return;

                  try {
                    const results = await Promise.allSettled(
                      persistedIds.map((nodeId) => deleteNode(nodeId))
                    );
                    results.forEach((result, index) => {
                      if (result.status === 'fulfilled') {
                        clearProposalDraftReady(projectId, persistedIds[index]);
                      }
                    });
                    selectedIds.forEach((id) => markNodeDeleted(id));
                    await refresh();
                  } catch (error) {
                    console.error('[topic-selection] bulk delete API error:', error);
                  }
                }}
                className='rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700'
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>
    </DepthControlsContext.Provider>
  );
}
