'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Send, ChevronDown, ChevronUp } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState, useRef, useEffect, createContext, use, useCallback } from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Spinner } from '@/shared/ui/spinner';

import { useTopicPromptDraftStore } from '../model/topic-prompt-draft-store';
import { PROMPT_NODE_LOADING_STEPS, type LoadingStep } from '../model/types';

const MAX_TEXTAREA_HEIGHT = 280;
/** 주제 생성 완료 후 인풋 한 줄로 접을 때 (min-h-[36px]과 맞춤) */
const COMPACT_TEXTAREA_HEIGHT_PX = 26;

const PROMPT_TEXT_PLACEHOLDER =
  '건축 주제·가설·키워드를 입력하고 이지알앤디 플로와 건축 주제를 선정해보세요';

type TopicPromptMode = 'opportunity_exploration' | 'concretization';

// ============================================================================
// Headless 훅 — 입력 폼 로직
// ============================================================================

interface UseInputNodeProps {
  projectId: string;
  serverInitial?: string;
  onSubmit: (value: string, mode: TopicPromptMode) => void;
  autoFocus?: boolean;
  /** true: 로딩 끝·하위 노드 생성 후 인풋 높이를 한 줄로 접음 (포커스 시 잠시 펼침) */
  composerCompact?: boolean;
}

function useInputNode({
  projectId,
  serverInitial = '',
  onSubmit,
  autoFocus = true,
  composerCompact = false,
}: UseInputNodeProps) {
  const hydrated = useTopicPromptDraftStore((s) => s._hasHydrated);
  const input = useTopicPromptDraftStore((s) =>
    projectId ? (s.draftByProjectId[projectId] ?? '') : ''
  );
  const setPersistedDraft = useTopicPromptDraftStore((s) => s.setDraft);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const serverSeedKeyRef = useRef<string | null>(null);
  const [expandedForEdit, setExpandedForEdit] = useState(false);
  const [mode, setMode] = useState<TopicPromptMode>('opportunity_exploration');

  useEffect(() => {
    if (!composerCompact) queueMicrotask(() => setExpandedForEdit(false));
  }, [composerCompact]);

  const effectiveCompact = composerCompact && !expandedForEdit;

  useEffect(() => {
    serverSeedKeyRef.current = null;
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !hydrated) return;
    const key = `${projectId}\0${serverInitial}`;
    if (serverSeedKeyRef.current === key) return;
    const cur = useTopicPromptDraftStore.getState().draftByProjectId[projectId] ?? '';
    if (cur.trim()) {
      serverSeedKeyRef.current = key;
      return;
    }
    if (serverInitial.trim()) {
      setPersistedDraft(projectId, serverInitial);
    }
    serverSeedKeyRef.current = key;
  }, [projectId, hydrated, serverInitial, setPersistedDraft]);

  const setInput = useCallback(
    (v: string) => {
      if (projectId) setPersistedDraft(projectId, v);
    },
    [projectId, setPersistedDraft]
  );

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    if (effectiveCompact) {
      el.style.height = `${COMPACT_TEXTAREA_HEIGHT_PX}px`;
      el.style.maxHeight = `${COMPACT_TEXTAREA_HEIGHT_PX}px`;
      el.style.overflowY = 'hidden';
      return;
    }
    el.style.maxHeight = '';
    el.style.height = 'auto';
    const newHeight = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT);
    el.style.height = `${newHeight}px`;
    el.style.overflowY = newHeight >= MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
  }, [effectiveCompact]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight, effectiveCompact]);

  const onComposerFocus = useCallback(() => {
    if (composerCompact) setExpandedForEdit(true);
  }, [composerCompact]);

  const onComposerBlur = useCallback(() => {
    if (composerCompact) setExpandedForEdit(false);
  }, [composerCompact]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSubmit(input.trim(), mode);
  };

  return {
    input,
    setInput,
    textareaRef,
    handleSubmit,
    mode,
    setMode,
    canSubmit: input.trim().length > 0,
    adjustTextareaHeight,
    composerCompact: effectiveCompact,
    onComposerFocus,
    onComposerBlur,
  };
}

// ============================================================================
// Compound Component — Context
// ============================================================================

interface InputNodeContextValue {
  state: { input: string; canSubmit: boolean; mode: TopicPromptMode };
  actions: {
    setInput: (v: string) => void;
    setMode: (mode: TopicPromptMode) => void;
    handleSubmit: (e: React.FormEvent) => void;
  };
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  composerCompact: boolean;
  onComposerFocus: () => void;
  onComposerBlur: () => void;
}

const InputNodeContext = createContext<InputNodeContextValue | null>(null);

function useInputNodeContext() {
  const ctx = use(InputNodeContext);
  if (!ctx) throw new Error('InputNode 컴포넌트는 InputNode.Root 내부에서 사용해야 합니다');
  return ctx;
}

function InputNodeRoot({
  projectId,
  serverInitial = '',
  onSubmit,
  composerCompact = false,
  children,
}: {
  projectId: string;
  serverInitial?: string;
  onSubmit: (value: string, mode: TopicPromptMode) => void;
  composerCompact?: boolean;
  children: React.ReactNode;
}) {
  const logic = useInputNode({ projectId, serverInitial, onSubmit, composerCompact });
  const value: InputNodeContextValue = {
    state: { input: logic.input, canSubmit: logic.canSubmit, mode: logic.mode },
    actions: { setInput: logic.setInput, setMode: logic.setMode, handleSubmit: logic.handleSubmit },
    textareaRef: logic.textareaRef,
    composerCompact: logic.composerCompact,
    onComposerFocus: logic.onComposerFocus,
    onComposerBlur: logic.onComposerBlur,
  };
  return (
    <InputNodeContext.Provider value={value}>
      <div
        id='topic-selection-prompt-node'
        className='topic-selection-prompt-node relative w-[315px] rounded-lg border border-teal-500/40 bg-teal-500 p-3.5 text-white'
      >
        <Handle
          type='source'
          position={Position.Right}
          id='right-source'
          className='!h-2.5 !w-2.5 !border !border-zinc-300 !bg-zinc-400'
        />
        {children}
      </div>
    </InputNodeContext.Provider>
  );
}

function InputNodeForm({ placeholder }: { placeholder?: string }) {
  const { state, actions, textareaRef, composerCompact, onComposerFocus, onComposerBlur } =
    useInputNodeContext();
  return (
    <form onSubmit={actions.handleSubmit} className='flex flex-col gap-2'>
      <textarea
        id='topic-prompt-input'
        ref={textareaRef}
        value={state.input}
        onChange={(e) => actions.setInput(e.target.value)}
        onFocus={onComposerFocus}
        onBlur={onComposerBlur}
        placeholder={placeholder}
        rows={1}
        className={`topic-prompt-node-textarea max-h-[280px] min-h-[26px] w-full resize-none rounded border-none bg-white/15 px-3 py-1.5 text-xs text-white outline-none placeholder:text-white/70 ${
          composerCompact ? 'overflow-y-hidden' : 'overflow-y-auto'
        }`}
        style={{ height: 'auto' }}
      />
      <div className='flex items-center justify-between gap-2'>
        <Select
          value={state.mode}
          onValueChange={(value) => actions.setMode(value as TopicPromptMode)}
        >
          <SelectTrigger
            id='topic-prompt-mode-select'
            size='sm'
            className='h-8 border-none bg-white/15 text-xs text-white [&>span]:text-white/90 data-[placeholder]:text-white/70'
          >
            <SelectValue placeholder='유형 선택' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='opportunity_exploration'>기회탐색형</SelectItem>
            <SelectItem value='concretization'>주제구체화</SelectItem>
          </SelectContent>
        </Select>
        <button
          id='topic-prompt-send'
          type='submit'
          disabled={!state.canSubmit}
          title='전송'
          aria-label='건축 주제 전송'
          className='flex h-8 w-8 shrink-0 items-center justify-center rounded border-none text-white transition-colors disabled:cursor-not-allowed disabled:bg-white/10 disabled:opacity-50 not-disabled:bg-white/20 not-disabled:hover:bg-white/30'
        >
          <Send className='size-4' />
        </button>
      </div>
    </form>
  );
}

export const InputNodeCompound = Object.assign(InputNodeRoot, { Form: InputNodeForm });

// ============================================================================
// 로딩 패널 — 2단 메시지 + 접기/펼치기
// ============================================================================

/**
 * 로딩 중 또는 완료 후 축소 상태에서 보여주는 패널.
 *
 * - isLoading=true: 단계별 메시지 또는 SSE 누적 메시지를 표시하며 확장
 * - streamStepLabel/streamDetails가 있으면 SSE 실시간 메시지 사용 (우선)
 * - isLoading=false (완료): 접힌 상태로 전환. 클릭하면 펼쳐서 기록을 볼 수 있음
 */
interface LoadingPanelProps {
  /** true면 메시지 재생 중, false면 완료 후 접힌 상태 */
  isLoading: boolean;
  /** 재생할 단계 목록 (PROMPT_NODE_LOADING_STEPS) - stream 미사용 시 */
  steps: LoadingStep[];
  /** SSE 상단 제목 */
  streamStepLabel?: string;
  /** SSE progress 누적 메시지 목록 */
  streamDetails?: string[];
  /** 완료 시 부모에 알림 – 노드 크기가 원래대로 돌아갈 타이밍 */
  onComplete?: () => void;
}

/**
 * 현재 표시 중인 detail 메시지 인덱스를 관리하는 훅.
 * 각 detail은 DETAIL_INTERVAL_MS 간격으로 하나씩 나타남.
 * 모든 단계가 끝나면 onComplete 호출 후 자동 종료.
 *
 * TODO: SSE 연결 시 이 훅 대신 서버 이벤트로 currentStep/currentDetail을 외부에서 주입
 */
const DETAIL_INTERVAL_MS = 1200; // detail 메시지 하나 표시 간격 (ms)

/** 각 단계의 렌더 상태 */
type StepState =
  | { status: 'pending' } // 아직 시작 안 됨
  | { status: 'active'; visibleCount: number } // 진행 중 — detail 순차 표시
  | { status: 'done' }; // 완료 — 접힌 상태로 표시

/**
 * 모든 단계의 상태를 배열로 관리.
 * 이전 단계가 done이 되어도 UI에서 사라지지 않고 접힌 채로 유지됨.
 *
 * TODO: SSE 연결 시 이 훅 대신 서버 이벤트로 stepStates를 외부에서 주입
 */
function useLoadingSequence(isLoading: boolean, steps: LoadingStep[], onComplete?: () => void) {
  const [stepStates, setStepStates] = useState<StepState[]>(() =>
    steps.map((_, i) => (i === 0 ? { status: 'active', visibleCount: 1 } : { status: 'pending' }))
  );

  // isLoading이 false→true로 바뀔 때 초기화
  useEffect(() => {
    if (isLoading) {
      setStepStates(
        steps.map((_, i) =>
          i === 0 ? { status: 'active', visibleCount: 1 } : { status: 'pending' }
        )
      );
    }
  }, [isLoading, steps]);

  // active 단계를 찾아 detail을 하나씩 진행
  useEffect(() => {
    if (!isLoading) return;

    const activeIndex = stepStates.findIndex((s) => s.status === 'active');
    if (activeIndex === -1) return;

    const activeState = stepStates[activeIndex] as { status: 'active'; visibleCount: number };
    const currentStep = steps[activeIndex];
    if (!currentStep) return;

    const timer = setInterval(() => {
      const nextCount = activeState.visibleCount + 1;

      if (nextCount > currentStep.details.length) {
        // 현재 단계 detail 모두 표시 완료 → done으로 전환 후 다음 단계 active
        const nextActiveIndex = activeIndex + 1;

        if (nextActiveIndex >= steps.length) {
          // 모든 단계 완료
          setStepStates((prev) => prev.map((s, i) => (i === activeIndex ? { status: 'done' } : s)));
          clearInterval(timer);
          onComplete?.();
          return;
        }

        setStepStates((prev) =>
          prev.map((s, i) => {
            if (i === activeIndex) return { status: 'done' };
            if (i === nextActiveIndex) return { status: 'active', visibleCount: 1 };
            return s;
          })
        );
      } else {
        // 같은 단계에서 detail 하나 더 추가
        setStepStates((prev) =>
          prev.map((s, i) =>
            i === activeIndex ? { status: 'active', visibleCount: nextCount } : s
          )
        );
      }
    }, DETAIL_INTERVAL_MS);

    return () => clearInterval(timer);
    // activeIndex와 visibleCount가 바뀔 때마다 새 인터벌
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, stepStates]);

  return { stepStates };
}

function LoadingPanel({
  isLoading,
  steps,
  streamStepLabel,
  streamDetails,
  onComplete,
}: LoadingPanelProps) {
  const useStream = Boolean(
    streamStepLabel !== undefined || (streamDetails && streamDetails.length > 0)
  );
  const { stepStates } = useLoadingSequence(isLoading && !useStream, steps, onComplete);
  // 완료 후 사용자가 수동으로 전체 펼치기/접기
  const [expanded, setExpanded] = useState(false);
  const streamListRef = useRef<HTMLUListElement>(null);

  // 로딩이 끝나면 자동으로 접힘
  useEffect(() => {
    if (!isLoading) queueMicrotask(() => setExpanded(false));
  }, [isLoading]);

  const streamHistory = streamDetails ?? [];
  const shouldShowStreamHistory = streamHistory.length > 0;

  useEffect(() => {
    if (!isLoading || !useStream) return;
    const el = streamListRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [isLoading, useStream, streamHistory]);

  // 로딩 완료 후 — 작은 요약 헤더 + 선택적 전체 펼침
  if (!isLoading) {
    return (
      <div className='mt-2 overflow-hidden rounded-md bg-white/10'>
        <button
          type='button'
          onClick={() => setExpanded((v) => !v)}
          className='flex w-full items-center justify-between px-3 py-2 text-left text-xs text-white/80 transition-colors hover:bg-white/10'
        >
          <span>분석 완료 — 주제 후보 3개 생성됨</span>
          {expanded ? (
            <ChevronUp className='size-3 shrink-0 opacity-70' />
          ) : (
            <ChevronDown className='size-3 shrink-0 opacity-70' />
          )}
        </button>
        {expanded && (
          <div className='border-t border-white/10 px-3 pb-3 pt-2'>
            {shouldShowStreamHistory ? (
              <ul className='topic-prompt-node-scroll space-y-1'>
                {streamHistory.map((detail, index) => (
                  <li key={`${detail}-${index}`} className='flex items-start gap-1.5 text-[11px] text-white/65'>
                    <span className='mt-px shrink-0 text-white/40'>·</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            ) : (
              steps.map((step, si) => (
                <div key={si} className='mb-3 last:mb-0'>
                  <p className='mb-1 text-[11px] font-medium text-white/90'>{step.stepLabel}</p>
                  <ul className='topic-prompt-node-scroll space-y-0.5'>
                    {step.details.map((d, di) => (
                      <li key={di} className='flex items-start gap-1.5 text-[11px] text-white/60'>
                        <span className='mt-px shrink-0 text-white/40'>·</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  // SSE 스트림 모드: progress 누적 로그 실시간 표시
  if (useStream && isLoading) {
    return (
      <div className='mt-2 rounded-md bg-white/10 py-2.5'>
        <ul
          ref={streamListRef}
          className='topic-prompt-node-scroll min-h-[168px] max-h-52 space-y-1 overflow-y-auto'
        >
          {streamDetails && streamDetails.length > 0 ? (
            streamDetails.map((detail, i) => (
              <li
                key={i}
                className='flex items-start gap-1.5 px-3 text-[11px] text-white/70 animate-in fade-in duration-300'
              >
                {i === streamDetails.length - 1 ? (
                  <Spinner className='mt-px size-3 shrink-0 text-white/80' />
                ) : (
                  <span className='mt-px flex size-3 shrink-0 items-center justify-center'>
                    <span className='size-1.5 rounded-full bg-white/30' />
                  </span>
                )}
                <span>{detail}</span>
              </li>
            ))
          ) : (
            <li className='flex min-h-[168px] items-start gap-1.5 px-3 pt-0.5 text-[11px] text-white/70'>
              <Spinner className='mt-px size-3 shrink-0 text-white/80' />
            </li>
          )}
        </ul>
      </div>
    );
  }

  // 로딩 중 — 단계별로 렌더. done=접힘, active=detail 순차 표시, pending=숨김
  return (
    <div className='mt-2 space-y-1.5 rounded-md bg-white/10 px-3 py-2.5'>
      {steps.map((step, si) => {
        const state = stepStates[si];
        if (!state || state.status === 'pending') return null;

        const isDone = state.status === 'done';
        const visibleDetails =
          state.status === 'active' ? step.details.slice(0, state.visibleCount) : [];

        return (
          <div key={si} className={si > 0 ? 'border-t border-white/10 pt-1.5' : ''}>
            {/* 단계 제목 — done이면 흐리게 */}
            <div
              className={`mb-1.5 flex items-center gap-1.5 transition-colors ${isDone ? 'text-white/50' : 'text-white/95'}`}
            >
              {!isDone && <Spinner className='size-3 shrink-0' />}
              <p className='text-xs font-medium leading-snug'>{step.stepLabel}</p>
            </div>

            {/* done이면 detail 접힘 (표시 안 함), active면 순차 표시 */}
            {!isDone && (
              <ul className='topic-prompt-node-scroll max-h-40 space-y-1 overflow-y-auto'>
                {visibleDetails.map((detail, i) => (
                  <li
                    key={i}
                    className='flex items-start gap-1.5 text-[11px] text-white/70 animate-in fade-in duration-300'
                  >
                    {i === visibleDetails.length - 1 ? (
                      <span className='mt-px size-1.5 shrink-0 rounded-full bg-white/60 animate-pulse' />
                    ) : (
                      <span className='mt-px size-1.5 shrink-0 rounded-full bg-white/30' />
                    )}
                    {detail}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// ReactFlow 노드 래퍼 (nodeTypes에 등록되는 컴포넌트)
// ============================================================================

/**
 * InputNode는 ReactFlow의 `prompt` nodeType으로 등록됨.
 *
 * data 필드:
 *   - initialPrompt?: string — GET topics/nodes 중 depth===0 노드의 title(또는 보조: 응답 title·제안서 GET). 로컬에 저장된 초안이 없을 때만 사용
 *   - 입력 내용은 프로젝트별로 Zustand persist(localStorage)에 보관 · 전송 후에도 칸 비우지 않음
 *   - isLoading: boolean — view에서 generateTopics 처리 중일 때 true로 설정
 *   - hasCompleted: boolean — 처음 한 번이라도 완료된 적 있으면 true (로딩 패널 유지용)
 *
 * 흐름:
 *   1. 사용자 입력 → Send 버튼 → generateTopics CustomEvent 발행
 *   2. View가 노드 data.isLoading = true 설정 (타임슬립 시뮬레이션 시작)
 *   3. 노드 높이가 아래로 확장되며 로딩 패널 표시
 *   4. 시뮬레이션 완료 → View가 data.isLoading = false + topic 노드 생성
 *   5. 로딩 패널이 축소(접힘) 상태로 전환 → 클릭하면 기록 펼침
 */
export function InputNode({ data }: NodeProps) {
  const params = useParams();
  const projectId = typeof params?.id === 'string' ? params.id : '';
  const d = data as Record<string, unknown>;
  const isLoading = !!d.isLoading;
  const hasCompleted = !!d.hasCompleted;
  const streamStepLabel = d.streamStepLabel as string | undefined;
  const streamDetails = d.streamDetails as string[] | undefined;
  const fromServer = d.initialPrompt;
  const serverInitial = typeof fromServer === 'string' && fromServer.trim() ? fromServer.trim() : '';

  const handleSubmit = (value: string, mode: TopicPromptMode) => {
    window.dispatchEvent(new CustomEvent('generateTopics', { detail: { prompt: value, mode } }));
  };

  const composerCompact = hasCompleted && !isLoading;

  return (
    <InputNodeCompound
      projectId={projectId}
      serverInitial={serverInitial}
      onSubmit={handleSubmit}
      composerCompact={composerCompact}
    >
      <InputNodeCompound.Form placeholder={PROMPT_TEXT_PLACEHOLDER} />

      {/* 로딩 중이거나, 완료 기록이 있을 때 패널 렌더링 */}
      {(isLoading || hasCompleted) && (
        <LoadingPanel
          isLoading={isLoading}
          steps={PROMPT_NODE_LOADING_STEPS}
          streamStepLabel={streamStepLabel}
          streamDetails={streamDetails}
          onComplete={() => {
            window.dispatchEvent(new CustomEvent('promptNodeLoadingComplete'));
          }}
        />
      )}
    </InputNodeCompound>
  );
}
