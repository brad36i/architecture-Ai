'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Download, History, Plus } from 'lucide-react';
import { useParams } from 'next/navigation';
import { ResizableBox } from 'react-resizable';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import {
  buildGeneratedPreview,
  buildIllustrationContent,
  DiagramArtifactCards,
  DiagramChatPanel,
  DraftPreview,
  extractMethodologyContent,
  fetchIllustrationChatHistory,
  fetchIllustrationChatStream,
  fetchIllustrationSessions,
  getDiagramPromptPreset,
  mapHistoryToChatMessages,
  mapIllustrationHistoryToArtifacts,
  mapPresetToVisualType,
  pickLatestIllustrationSessionId,
  type DiagramChatMessage,
  type DiagramPromptPresetId,
  type DiagramStreamProgress,
  type GeneratedDiagramPreview,
  type IllustrationSessionRow,
} from '@/features/diagram-table';
import {
  downloadDataUrlAsPng,
  sanitizeDiagramExportBasename,
} from '@/features/diagram-table/lib/export-diagram-png';
import { useResearchPlanStore } from '@/features/research-plan';
import { cn } from '@/shared/lib/utils';
import { useAsidebarStore } from '@/shared/stores/asidebar-store';
import { Button } from '@/shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

const MIN_CHAT_WIDTH = 280;
const MAX_CHAT_WIDTH = 600;
const DEFAULT_CHAT_WIDTH = 360;

function upsertProgressSteps(prev: DiagramStreamProgress[], next: DiagramStreamProgress) {
  const key = next.step || next.message;
  const index = prev.findIndex((item) => (item.step || item.message) === key);

  if (index === -1) return [...prev, next];

  const copied = [...prev];
  copied[index] = next;
  return copied;
}

function mapPresetToArtifactType(presetId: DiagramPromptPresetId) {
  switch (presetId) {
    case 'flowchart':
      return 'roadmap' as const;
    case 'table':
      return 'comparison' as const;
    case 'timeline':
      return 'gantt' as const;
    case 'diagram':
    default:
      return 'concept' as const;
  }
}

const ILLUSTRATION_HISTORY_QK = (projectId: string, sessionId: number) =>
  ['illustrationChatHistory', projectId, sessionId] as const;

const ILLUSTRATION_SESSIONS_QK = (projectId: string) =>
  ['illustrationSessions', projectId] as const;

function previewTextForLog(value: string, limit = 160) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit)}…`;
}

function serializeErrorForLog(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    };
  }
  return { value: error };
}

export function DiagramTableView() {
  const params = useParams();
  const projectId = (params?.id as string) ?? '';
  const queryClient = useQueryClient();
  const [illustrationSessionId, setIllustrationSessionId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DiagramChatMessage[]>([]);
  const [progressSteps, setProgressSteps] = useState<DiagramStreamProgress[]>([]);
  const [generatedPreview, setGeneratedPreview] = useState<GeneratedDiagramPreview | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [lastPresetId, setLastPresetId] = useState<DiagramPromptPresetId>('diagram');
  const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH);
  const [containerHeight, setContainerHeight] = useState(600);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const researchPlanDraft = useResearchPlanStore((state) => state.draft);
  const selectedResearchContent = useAsidebarStore(
    (state) => state.nodeDetailContext?.selectedContent?.researchContent
  );

  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    setIllustrationSessionId(null);
  }, [projectId]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const updateHeight = () => {
      const h = el.offsetHeight || el.clientHeight || 600;
      setContainerHeight(h > 0 ? h : 600);
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleChatResize = (
    _e: React.SyntheticEvent,
    data: { node: HTMLElement; size: { width: number; height: number } }
  ) => {
    setChatWidth(data.size.width);
  };

  const { data: illustrationSessions } = useQuery({
    queryKey: ILLUSTRATION_SESSIONS_QK(projectId),
    queryFn: () => fetchIllustrationSessions(projectId),
    enabled: Boolean(projectId),
  });

  useEffect(() => {
    if (!projectId || illustrationSessions === undefined) return;

    setIllustrationSessionId((prev) => {
      if (illustrationSessions.length === 0) {
        return prev ?? 1;
      }
      const idSet = new Set(illustrationSessions.map((s) => s.sessionId));
      if (prev != null && idSet.has(prev)) return prev;
      if (prev != null && !idSet.has(prev)) return prev;
      return pickLatestIllustrationSessionId(illustrationSessions) ?? 1;
    });
  }, [projectId, illustrationSessions]);

  const sessionOptions: IllustrationSessionRow[] = useMemo(() => {
    const rows = [...(illustrationSessions ?? [])];
    if (illustrationSessionId == null) return rows;
    if (!rows.some((r) => r.sessionId === illustrationSessionId)) {
      rows.unshift({
        sessionId: illustrationSessionId,
        title: `세션 ${illustrationSessionId}`,
        updatedAt: null,
        messageCount: 0,
        hasImage: false,
      });
    }
    return rows;
  }, [illustrationSessions, illustrationSessionId]);

  const sessionReady = illustrationSessionId !== null && illustrationSessions !== undefined;

  const { data: illustrationHistoryRows } = useQuery({
    queryKey: ILLUSTRATION_HISTORY_QK(projectId, illustrationSessionId ?? 0),
    queryFn: () => fetchIllustrationChatHistory(projectId, illustrationSessionId!),
    enabled: Boolean(projectId) && illustrationSessionId !== null,
  });

  useEffect(() => {
    if (isStreaming) return;
    if (illustrationHistoryRows === undefined) return;
    if (illustrationHistoryRows.length === 0) return;
    setMessages(mapHistoryToChatMessages(illustrationHistoryRows));
  }, [illustrationHistoryRows, isStreaming]);

  const selectedBodyContent = useMemo(() => {
    const selectedContent = selectedResearchContent?.trim();
    if (selectedContent) return selectedContent;
    return extractMethodologyContent(researchPlanDraft);
  }, [researchPlanDraft, selectedResearchContent]);

  const historyArtifacts = useMemo(
    () => mapIllustrationHistoryToArtifacts(illustrationHistoryRows),
    [illustrationHistoryRows]
  );

  const artifacts = useMemo(() => {
    if (!generatedPreview) return historyArtifacts;

    return [
      {
        id: 'generated-preview',
        type: mapPresetToArtifactType(lastPresetId),
        caption: '방금 생성한 결과',
        createdAt: new Date().toISOString(),
        thumbnailUrl: generatedPreview.imageDataUrl,
        draft: {
          type: mapPresetToArtifactType(lastPresetId),
          title: generatedPreview.title,
          content: generatedPreview.description,
        },
      },
      ...historyArtifacts,
    ];
  }, [generatedPreview, lastPresetId, historyArtifacts]);

  /** 이력·세션 변경 시 미리보기는 기본으로 가장 최신(목록 첫 항목)을 표시 */
  useEffect(() => {
    if (isStreaming) return;
    if (artifacts.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId((prev) => {
      if (prev != null && artifacts.some((a) => a.id === prev)) return prev;
      return artifacts[0]?.id ?? null;
    });
  }, [artifacts, isStreaming]);

  const selectedArtifact = selectedId
    ? artifacts.find((artifact) => artifact.id === selectedId)
    : null;

  const previewForCanvas = useMemo(() => {
    if (!selectedId || !selectedArtifact) {
      return generatedPreview;
    }
    if (selectedArtifact.id === 'generated-preview') {
      return generatedPreview;
    }
    if (selectedArtifact.thumbnailUrl) {
      return {
        title: selectedArtifact.draft.title,
        description: selectedArtifact.draft.content,
        imageDataUrl: selectedArtifact.thumbnailUrl,
      };
    }
    return null;
  }, [selectedId, selectedArtifact, generatedPreview]);

  const draft =
    selectedArtifact &&
    selectedArtifact.id !== 'generated-preview' &&
    !selectedArtifact.thumbnailUrl
      ? selectedArtifact.draft
      : null;

  const handleExportPng = () => {
    const dataUrl = previewForCanvas?.imageDataUrl;
    if (!dataUrl?.startsWith('data:image')) return;
    const base = sanitizeDiagramExportBasename(previewForCanvas?.title ?? 'diagram');
    downloadDataUrlAsPng(dataUrl, base);
  };

  const handleCreateNewIllustration = () => {
    abortControllerRef.current?.abort();
    const ids = illustrationSessions?.map((s) => s.sessionId) ?? [];
    const nextId = ids.length ? Math.max(...ids) + 1 : 1;
    setIllustrationSessionId(nextId);
    setSelectedId(null);
    setMessages([]);
    setProgressSteps([]);
    setGeneratedPreview(null);
    setHistoryOpen(true);
    setIsStreaming(false);
    void queryClient.invalidateQueries({ queryKey: ILLUSTRATION_SESSIONS_QK(projectId) });
  };

  const handleSendMessage = async ({
    content,
    presetId,
    maxCriticRounds,
  }: {
    content: string;
    presetId: DiagramPromptPresetId;
    maxCriticRounds: number;
  }) => {
    if (!projectId || isStreaming || illustrationSessionId === null) return;

    setLastPresetId(presetId);
    const preset = getDiagramPromptPreset(presetId);
    const userMessage = `[${preset.label}] ${content}`;
    const requestContent = buildIllustrationContent(content);
    const fallbackBodyContent = selectedBodyContent.trim();
    const historyEnabledSessionId = illustrationSessionId;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let latestAssistantMessage = '';
    let hasHandledError = false;

    console.log('[diagram-table][view][send]', {
      projectId,
      presetId,
      presetLabel: preset.label,
      visualIntent: preset.label,
      visualIntentLength: preset.label.length,
      visualIntentPreview: previewTextForLog(preset.label),
      bodyContentLength: requestContent.length,
      bodyContentPreview: previewTextForLog(requestContent),
      fallbackBodyContentLength: fallbackBodyContent.length,
      fallbackBodyContentPreview: previewTextForLog(fallbackBodyContent),
      illustrationSessionId,
    });

    setSelectedId(null);
    setGeneratedPreview(null);
    setProgressSteps([]);
    setIsStreaming(true);
    setHistoryOpen(false);
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: userMessage },
    ]);

    try {
      await fetchIllustrationChatStream(
        projectId,
        {
          content: requestContent,
          visual_intent: preset.label,
          visual_type: mapPresetToVisualType(presetId),
          session_id: historyEnabledSessionId,
          pipeline_mode: 'dev_full',
          max_critic_rounds: maxCriticRounds,
          profile: null,
        },
        {
          onProgress: (progress) => {
            setProgressSteps((prev) => upsertProgressSteps(prev, progress));
          },
          onChat: (message) => {
            latestAssistantMessage = message;
            console.log('[diagram-table][view][chat-message]', message);
            setMessages((prev) => [
              ...prev,
              { id: crypto.randomUUID(), role: 'assistant', content: message },
            ]);
          },
          onDone: (data) => {
            console.log('[diagram-table][view][done-data]', data);
            const preview = buildGeneratedPreview(
              data,
              latestAssistantMessage || `${preset.label} 생성이 완료되었습니다.`
            );
            console.log('[diagram-table][view][preview]', preview);
            setGeneratedPreview(preview);
            setHistoryOpen(true);
            void queryClient.invalidateQueries({
              queryKey: ILLUSTRATION_HISTORY_QK(projectId, historyEnabledSessionId),
            });
            void queryClient.invalidateQueries({
              queryKey: ILLUSTRATION_SESSIONS_QK(projectId),
            });
          },
          onError: (message) => {
            hasHandledError = true;
            console.error('[diagram-table][view][error]', message);
            setMessages((prev) => [
              ...prev,
              { id: crypto.randomUUID(), role: 'system', content: message },
            ]);
          },
        },
        controller.signal
      );
    } catch (error) {
      console.error('[diagram-table][view][catch]', {
        ...serializeErrorForLog(error),
        projectId,
        presetId,
        illustrationSessionId: historyEnabledSessionId,
        visualIntentLength: preset.label.length,
        bodyContentLength: requestContent.length,
        fallbackBodyContentLength: fallbackBodyContent.length,
      });
      if ((error as Error).name !== 'AbortError' && !hasHandledError) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'system',
            content: '도식/표 생성 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.',
          },
        ]);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsStreaming(false);
    }
  };

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <div ref={containerRef} className='flex min-h-0 flex-1 overflow-hidden gap-0'>
        <div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-r border-zinc-200 bg-white'>
          <div className='flex h-10 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3'>
            <div className='flex min-w-0 items-center gap-2'>
              <h2 className='shrink-0 text-sm font-medium text-zinc-800'>도식/표 미리보기</h2>
              <span className='hidden truncate text-xs text-zinc-500 sm:inline'>
                {selectedArtifact ? '이력에서 선택됨' : generatedPreview ? '생성됨' : '대기'}
              </span>
            </div>
            <div className='flex shrink-0 flex-wrap items-center justify-end gap-1.5'>
              <Select
                value={illustrationSessionId !== null ? String(illustrationSessionId) : ''}
                onValueChange={(v) => {
                  setIllustrationSessionId(Number(v));
                  setSelectedId(null);
                  setGeneratedPreview(null);
                  setProgressSteps([]);
                }}
                disabled={
                  isStreaming ||
                  illustrationSessions === undefined ||
                  illustrationSessionId === null
                }
              >
                <SelectTrigger
                  size='sm'
                  className='h-8 min-h-8 w-[min(9rem,28vw)] min-w-28 border-zinc-300 bg-white px-2.5 text-xs leading-none shadow-xs'
                >
                  <SelectValue
                    placeholder={
                      illustrationSessions === undefined
                        ? '세션…'
                        : illustrationSessionId === null
                          ? '준비…'
                          : '세션'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {sessionOptions.map((s) => (
                    <SelectItem key={s.sessionId} value={String(s.sessionId)}>
                      {s.title}
                      {typeof s.messageCount === 'number' ? ` · ${s.messageCount}` : ''}
                      {s.hasImage ? ' · 이미지' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='h-8 min-h-8 border-zinc-300 bg-white px-2.5 text-xs leading-none text-zinc-800 hover:bg-zinc-50'
                onClick={handleCreateNewIllustration}
                disabled={isStreaming}
              >
                <Plus className='size-3.5' />
                새 세션
              </Button>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='h-8 min-h-8 border-zinc-300 bg-white px-2.5 text-xs leading-none text-zinc-800 hover:bg-zinc-50'
                onClick={handleExportPng}
                disabled={isStreaming || !previewForCanvas?.imageDataUrl}
                title='PNG로 저장'
              >
                <Download className='size-3.5' />
                PNG보내기
              </Button>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='h-8 min-h-8 border-zinc-300 bg-white px-2.5 text-xs leading-none text-zinc-800 hover:bg-zinc-50'
                onClick={() => setHistoryOpen((prev) => !prev)}
              >
                <History className='size-3.5' />
                이력
                {historyOpen ? (
                  <ChevronDown className='size-3.5 opacity-70' />
                ) : (
                  <ChevronUp className='size-3.5 opacity-70' />
                )}
              </Button>
            </div>
          </div>

          <div className='min-h-0 flex-1 overflow-hidden p-3'>
            <DraftPreview
              draft={draft}
              generatedPreview={previewForCanvas}
              isStreaming={isStreaming}
            />
          </div>

          <section
            className={cn(
              'shrink-0 overflow-hidden border-t border-zinc-200 bg-zinc-50/90 transition-all duration-300',
              historyOpen ? 'h-[200px]' : 'h-9'
            )}
          >
            <div className='flex h-9 items-center justify-between border-b border-zinc-200/80 px-3'>
              <h3 className='text-xs font-medium text-zinc-700'>생성 이력</h3>
              <button
                type='button'
                onClick={() => setHistoryOpen((prev) => !prev)}
                className='rounded p-1 text-zinc-500 transition hover:bg-zinc-200/80 hover:text-zinc-800'
                aria-label={historyOpen ? '접기' : '펼치기'}
              >
                {historyOpen ? <ChevronDown className='size-4' /> : <ChevronUp className='size-4' />}
              </button>
            </div>
            {historyOpen ? (
              <div className='h-[calc(100%-2.25rem)] overflow-hidden p-3 pt-2'>
                <DiagramArtifactCards
                  artifacts={artifacts}
                  selectedId={selectedId}
                  onSelect={(id) => setSelectedId(id)}
                />
              </div>
            ) : null}
          </section>
        </div>

        <ResizableBox
          width={chatWidth}
          height={containerHeight}
          axis='x'
          resizeHandles={['w']}
          minConstraints={[MIN_CHAT_WIDTH, containerHeight]}
          maxConstraints={[MAX_CHAT_WIDTH, containerHeight]}
          onResize={handleChatResize}
          handle={(_: unknown, ref: React.Ref<HTMLDivElement>) => (
            <div ref={ref} className='research-plan-resize-handle' aria-hidden />
          )}
          className='research-plan-resizable shrink-0'
        >
          <div className='h-full overflow-hidden bg-zinc-200/80'>
            <DiagramChatPanel
              messages={messages}
              progressSteps={progressSteps}
              isStreaming={isStreaming}
              sessionReady={sessionReady}
              projectId={projectId}
              onSendMessage={handleSendMessage}
            />
          </div>
        </ResizableBox>
      </div>
    </div>
  );
}
