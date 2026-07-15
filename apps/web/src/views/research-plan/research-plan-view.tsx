"use client"

import { useQuery } from "@tanstack/react-query"
import React, { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { ResizableBox } from "react-resizable"
import {
  ChatPanel,
  fetchProposalChatHistory,
  ResearchPlanCanvas,
  useProposalDraft,
  useProposalSave,
  useResearchPlanStore,
} from "@/features/research-plan"

const MIN_LEFT_WIDTH = 280
const MAX_LEFT_WIDTH = 600
const DEFAULT_LEFT_WIDTH = 360

export function ResearchPlanView() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = (params?.id as string) ?? ""
  const sessionIdParam = Number(searchParams.get("sessionId") ?? "1")
  const sessionId = Number.isFinite(sessionIdParam) && sessionIdParam > 0 ? sessionIdParam : 1
  const sourceNodeId = searchParams.get("nodeId")
  const initializeProposalDraft = useResearchPlanStore((state) => state.initializeProposalDraft)
  const setMessages = useResearchPlanStore((state) => state.setMessages)
  const setProposalMeta = useResearchPlanStore((state) => state.setProposalMeta)
  const setSaveState = useResearchPlanStore((state) => state.setSaveState)
  const storeProjectId = useResearchPlanStore((state) => state.projectId)
  const storeSessionId = useResearchPlanStore((state) => state.sessionId)
  const storeSourceNodeId = useResearchPlanStore((state) => state.sourceNodeId)
  const storeDraft = useResearchPlanStore((state) => state.draft)
  const storeMessages = useResearchPlanStore((state) => state.messages)
  const proposalVersion = useResearchPlanStore((state) => state.proposalVersion)
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT_WIDTH)
  const [containerHeight, setContainerHeight] = useState(600)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastSavedDraftRef = useRef("")
  const latestDraftRef = useRef(storeDraft)
  const latestVersionRef = useRef<number | null>(proposalVersion)
  const queuedSaveDraftRef = useRef<string | null>(null)
  const isSavingRef = useRef(false)
  const {
    data: proposalDraft,
    isPending,
    isError,
  } = useProposalDraft(projectId, sessionId)
  const {
    data: proposalChatHistory,
    isPending: isChatHistoryPending,
  } = useQuery({
    queryKey: ["proposalChatHistory", projectId, sessionId],
    queryFn: () => fetchProposalChatHistory(projectId, sessionId),
    enabled: Boolean(projectId) && Number.isFinite(sessionId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 1,
  })
  const saveProposal = useProposalSave(projectId, sessionId)
  const hasLocalDraft =
    storeProjectId === projectId &&
    storeSessionId === sessionId &&
    storeSourceNodeId === sourceNodeId &&
    Boolean(storeDraft.trim())

  const showMainLayout =
    !(isPending && !hasLocalDraft) && !(isError && !hasLocalDraft)

  useLayoutEffect(() => {
    if (!showMainLayout) return
    const el = containerRef.current
    if (!el) return
    const updateHeight = () => {
      const h = el.offsetHeight || el.clientHeight || 600
      setContainerHeight(h > 0 ? h : 600)
    }
    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(el)
    return () => observer.disconnect()
  }, [showMainLayout])

  useEffect(() => {
    latestDraftRef.current = storeDraft
  }, [storeDraft])

  useEffect(() => {
    latestVersionRef.current = proposalVersion
  }, [proposalVersion])

  useEffect(() => {
    if (!projectId || !proposalDraft) return

    const historyMessages = (proposalChatHistory ?? []).map((item) => ({
      role:
        item.role === "user"
          ? ("user" as const)
          : item.role === "assistant" || item.role === "agent"
            ? ("assistant" as const)
            : ("assistant" as const),
      content: item.content?.trim() ?? "",
      unifiedDiff: item.unifiedDiff ?? null,
    }))
    const sameContext =
      storeProjectId === projectId &&
      storeSessionId === sessionId &&
      storeSourceNodeId === sourceNodeId

    if (!sameContext) {
      initializeProposalDraft({
        projectId,
        draft: proposalDraft.proposalContent,
        messages: historyMessages,
        sessionId,
        sourceNodeId,
        proposalVersion: proposalDraft.proposalVersion,
        hashlinedContent: proposalDraft.hashlinedContent,
      })
      lastSavedDraftRef.current = proposalDraft.proposalContent
      latestVersionRef.current = proposalDraft.proposalVersion
      return
    }

    setProposalMeta({
      proposalVersion: proposalDraft.proposalVersion,
      hashlinedContent: proposalDraft.hashlinedContent,
    })
    if (!lastSavedDraftRef.current) {
      lastSavedDraftRef.current = proposalDraft.proposalContent
    }
  }, [
    initializeProposalDraft,
    projectId,
    proposalChatHistory,
    proposalDraft,
    sessionId,
    setProposalMeta,
    sourceNodeId,
    storeProjectId,
    storeSessionId,
    storeSourceNodeId,
  ])

  useEffect(() => {
    if (
      !projectId ||
      isChatHistoryPending ||
      !proposalChatHistory ||
      proposalChatHistory.length === 0
    ) {
      return
    }

    const sameContext =
      storeProjectId === projectId &&
      storeSessionId === sessionId &&
      storeSourceNodeId === sourceNodeId

    if (!sameContext || storeMessages.length > 0) return

    setMessages(
      proposalChatHistory.map((item) => ({
        role:
          item.role === "user"
            ? ("user" as const)
            : item.role === "assistant" || item.role === "agent"
              ? ("assistant" as const)
              : ("assistant" as const),
        content: item.content?.trim() ?? "",
        unifiedDiff: item.unifiedDiff ?? null,
      }))
    )
  }, [
    isChatHistoryPending,
    projectId,
    proposalChatHistory,
    sessionId,
    setMessages,
    sourceNodeId,
    storeMessages.length,
    storeProjectId,
    storeSessionId,
    storeSourceNodeId,
  ])

  useEffect(() => {
    if (!projectId) return

    const persistQueuedDraft = async () => {
      if (isSavingRef.current) return

      const nextDraft = queuedSaveDraftRef.current
      if (nextDraft == null || nextDraft === lastSavedDraftRef.current) return

      isSavingRef.current = true
      queuedSaveDraftRef.current = null
      setSaveState("saving", "저장 중...")

      try {
        const saved = await saveProposal.mutateAsync({
          proposalContent: nextDraft,
          baseVersion: latestVersionRef.current,
        })

        lastSavedDraftRef.current = nextDraft
        latestVersionRef.current = saved.proposalVersion
        setProposalMeta({ proposalVersion: saved.proposalVersion })

        if (queuedSaveDraftRef.current == null && latestDraftRef.current === nextDraft) {
          setSaveState("saved", "저장됨")
        } else {
          setSaveState("idle", null)
        }
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "건축 제안서 저장에 실패했습니다."
        setSaveState("error", message)
      } finally {
        isSavingRef.current = false
        if (queuedSaveDraftRef.current != null) {
          void persistQueuedDraft()
        }
      }
    }

    if (
      storeProjectId !== projectId ||
      storeSessionId !== sessionId ||
      storeSourceNodeId !== sourceNodeId
    ) {
      return
    }

    if (storeDraft === lastSavedDraftRef.current) return

    const timer = window.setTimeout(() => {
      queuedSaveDraftRef.current = storeDraft
      void persistQueuedDraft()
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [
    projectId,
    saveProposal,
    sessionId,
    setProposalMeta,
    setSaveState,
    sourceNodeId,
    storeDraft,
    storeProjectId,
    storeSessionId,
    storeSourceNodeId,
  ])

  const handleResize = (_e: React.SyntheticEvent, data: { node: HTMLElement; size: { width: number; height: number } }) => {
    setLeftWidth(data.size.width)
  }

  if (isPending && !hasLocalDraft) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-zinc-500">건축 제안서 초안을 불러오는 중...</p>
      </div>
    )
  }

  if (isError && !hasLocalDraft) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-red-500">
          건축 제안서 초안을 불러올 수 없습니다. API 서버 연결을 확인해 주세요.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={containerRef} className="flex min-h-0 flex-1 overflow-hidden gap-0">
        <div className="min-w-0 flex-1 overflow-hidden border-r border-zinc-200 bg-white">
          <ResearchPlanCanvas />
        </div>
        <ResizableBox
          width={leftWidth}
          height={containerHeight}
          axis="x"
          resizeHandles={["w"]}
          minConstraints={[MIN_LEFT_WIDTH, containerHeight]}
          maxConstraints={[MAX_LEFT_WIDTH, containerHeight]}
          onResize={handleResize}
          handle={(_: unknown, ref: React.Ref<HTMLDivElement>) => <div ref={ref} className="research-plan-resize-handle" aria-hidden />}
          className="research-plan-resizable shrink-0"
        >
          <div className="h-full overflow-hidden bg-zinc-200/80">
            <ChatPanel />
          </div>
        </ResizableBox>
      </div>
    </div>
  )
}
