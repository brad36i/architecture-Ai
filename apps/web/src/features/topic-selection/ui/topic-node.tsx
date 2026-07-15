'use client';

import { Handle, Position } from '@xyflow/react';
import {
  MoreHorizontal,
  Pin,
  RefreshCw,
  Plus,
  ChevronDown,
  FileSearch,
  FileText,
  Loader2,
  Bookmark,
} from 'lucide-react';
import { useState, useRef, useEffect, createContext, use } from 'react';

import { useAsidebarStore } from '@/shared/stores/asidebar-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Spinner } from '@/shared/ui/spinner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';

import type { TopicContent, SelectedTopicContent } from '../model/types';
import { SELECTED_TOPIC_LIMITS, TOPIC_NODE_LOADING_STEPS } from '../model/types';

// ============================================================================
// DepthControlsContext — depth 하단 버튼에서 사용
// ============================================================================

export type DepthControlsContextValue = {
  lastNodeIdPerDepth: Map<number, string>;
  onDepthAdd: (depth: number, anchorNodeId: string) => void;
  onDepthRefresh: (depth: number) => void;
};

export const DepthControlsContext = createContext<DepthControlsContextValue | null>(null);

type ProposalGenerationMode = 'fast' | 'slow';

const PROPOSAL_MODE_LABEL: Record<ProposalGenerationMode, string> = {
  fast: '빠른 모드',
  slow: '느린 모드',
};

// ============================================================================
// Headless 훅
// ============================================================================

interface UseTopicNodeProps {
  id: string;
  initialChecked?: boolean;
  initialPinned?: boolean;
  onCheckChange: (id: string, checked: boolean) => void;
  onPinChange: (id: string, pinned: boolean) => void;
  onHypothesisSubmit: (id: string, prompt: string) => void;
  autoFocus?: boolean;
}

function useTopicNode({
  id,
  initialChecked = false,
  initialPinned = false,
  onCheckChange,
  onPinChange,
  onHypothesisSubmit,
  autoFocus = false,
}: UseTopicNodeProps) {
  const [checked, setChecked] = useState(initialChecked);
  const [pinned, setPinned] = useState(initialPinned);
  const [inputValue, setInputValue] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [proposalMode, setProposalMode] = useState<ProposalGenerationMode>('fast');
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChecked(initialChecked);
  }, [initialChecked]);
  useEffect(() => {
    setPinned(initialPinned);
  }, [initialPinned]);
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && e.target instanceof Element && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handlePinToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const next = !pinned;
    setPinned(next);
    onPinChange(id, next);
  };

  const handleCheckToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const next = !checked;
    setChecked(next);
    onCheckChange(id, next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inputValue.trim()) return;
    onHypothesisSubmit(id, inputValue.trim());
  };

  return {
    checked,
    pinned,
    inputValue,
    setInputValue,
    menuOpen,
    proposalMode,
    setMenuOpen,
    setProposalMode,
    inputRef,
    menuRef,
    handlePinToggle,
    handleCheckToggle,
    handleSubmit,
  };
}

// ============================================================================
// Compound Component — state/actions/meta interface
// ============================================================================

export interface NodeDetailData {
  label: string;
  topicSelected: boolean;
  displayContent: string;
  aiContent?: {
    detail?: string;
  };
  selectedContent?: {
    finalObjective?: string;
    researchContent?: string;
    expectedEffectAndPlan?: string;
  };
}

interface TopicNodeState {
  checked: boolean;
  pinned: boolean;
  inputValue: string;
  menuOpen: boolean;
  proposalMode: ProposalGenerationMode;
  id: string;
  depth: number;
  tags: string[];
  isLastInDepth: boolean;
  isLoading: boolean;
  fromMerge: boolean;
  hasContent: boolean;
  isLastNode: boolean;
  canSelectTopic: boolean;
  isTopicSelecting: boolean;
  isProposalCreating: boolean;
  isProposalDraftReady: boolean;
  historyId: string | null;
  backendNodeId: string | null;
  parentNodeId: string | null;
  isTemporaryNode: boolean;
  nodeDetailData: NodeDetailData;
}

interface TopicNodeActions {
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setProposalMode: React.Dispatch<React.SetStateAction<ProposalGenerationMode>>;
  handlePinToggle: (e: React.MouseEvent) => void;
  handleCheckToggle: (e: React.MouseEvent) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

interface TopicNodeContextValue {
  state: TopicNodeState;
  actions: TopicNodeActions;
  inputRef: React.RefObject<HTMLInputElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
}

const TopicNodeContext = createContext<TopicNodeContextValue | null>(null);

function useTopicNodeContext() {
  const ctx = use(TopicNodeContext);
  if (!ctx) throw new Error('TopicNode 컴포넌트는 TopicNode.Root 내부에서 사용해야 합니다');
  return ctx;
}

function TopicNodeRoot({
  id,
  depth,
  tags,
  checked,
  pinned,
  isLoading,
  isNew,
  fromMerge,
  hasContent,
  isLastNode,
  canSelectTopic,
  isTopicSelecting,
  isProposalCreating,
  isProposalDraftReady,
  historyId,
  backendNodeId,
  parentNodeId,
  isTemporaryNode,
  nodeDetailData,
  onCheckChange,
  onPinChange,
  onHypothesisSubmit,
  children,
}: {
  id: string;
  depth: number;
  tags: string[];
  checked: boolean;
  pinned: boolean;
  isLoading: boolean;
  isNew: boolean;
  fromMerge: boolean;
  hasContent: boolean;
  isLastNode: boolean;
  canSelectTopic: boolean;
  isTopicSelecting: boolean;
  isProposalCreating: boolean;
  isProposalDraftReady: boolean;
  historyId: string | null;
  backendNodeId: string | null;
  parentNodeId: string | null;
  isTemporaryNode: boolean;
  nodeDetailData: NodeDetailData;
  onCheckChange: (id: string, checked: boolean) => void;
  onPinChange: (id: string, pinned: boolean) => void;
  onHypothesisSubmit: (id: string, prompt: string) => void;
  children: React.ReactNode;
}) {
  const logic = useTopicNode({
    id,
    initialChecked: checked,
    initialPinned: pinned,
    onCheckChange,
    onPinChange,
    onHypothesisSubmit,
    autoFocus: isNew,
  });
  const depthCtx = use(DepthControlsContext);
  const isLastInDepth = depthCtx?.lastNodeIdPerDepth.get(depth) === id;

  const value: TopicNodeContextValue = {
    state: {
      checked: logic.checked,
      pinned: logic.pinned,
      inputValue: logic.inputValue,
      menuOpen: logic.menuOpen,
      proposalMode: logic.proposalMode,
      id,
      depth,
      tags,
      isLastInDepth,
      isLoading,
      fromMerge,
      hasContent,
      isLastNode,
      canSelectTopic,
      isTopicSelecting,
      isProposalCreating,
      isProposalDraftReady,
      historyId,
      backendNodeId,
      parentNodeId,
      isTemporaryNode,
      nodeDetailData,
    },
    actions: {
      setInputValue: logic.setInputValue,
      setMenuOpen: logic.setMenuOpen,
      setProposalMode: logic.setProposalMode,
      handlePinToggle: logic.handlePinToggle,
      handleCheckToggle: logic.handleCheckToggle,
      handleSubmit: logic.handleSubmit,
    },
    inputRef: logic.inputRef,
    menuRef: logic.menuRef,
  };
  const isNodeLoadingVisual = isLoading || isTopicSelecting || isProposalCreating;

  return (
    <TopicNodeContext.Provider value={value}>
      <div
        className={`relative w-[315px] cursor-grab active:cursor-grabbing rounded-lg border bg-white shadow-sm transition-all ${
          isNodeLoadingVisual ? 'topic-node-loading-shell' : ''
        }`}
        style={{
          borderColor: logic.checked ? '#667eea' : '#e5e7eb',
          boxShadow: logic.checked ? '0 0 0 2px rgba(102, 126, 234, 0.2)' : undefined,
        }}
      >
        {children}
        <Handle
          type='source'
          position={Position.Left}
          id='left-source'
          className='!h-2.5 !w-2.5 !border !border-zinc-300 !bg-zinc-400'
        />
        <Handle
          type='target'
          position={Position.Left}
          id='left-target'
          className='!h-2.5 !w-2.5 !border !border-zinc-300 !bg-zinc-400'
        />
        <Handle
          type='source'
          position={Position.Right}
          id='right-source'
          className='!h-2.5 !w-2.5 !border !border-zinc-300 !bg-zinc-400'
        />
        <Handle
          type='target'
          position={Position.Right}
          id='right-target'
          className='!h-2.5 !w-2.5 !border !border-zinc-300 !bg-zinc-400'
        />
      </div>
    </TopicNodeContext.Provider>
  );
}

function TopicNodeHeader() {
  const { state, actions, menuRef } = useTopicNodeContext();
  const debugLines = [
    `nodeId: ${state.id}`,
    `backendNodeId: ${state.backendNodeId ?? '-'}`,
    `parentNodeId: ${state.parentNodeId ?? '-'}`,
    `historyId: ${state.historyId ?? '-'}`,
    `isTemporaryNode: ${state.isTemporaryNode ? 'true' : 'false'}`,
    `depth(레이아웃): ${state.depth}`,
    `isLastNode(최종): ${state.isLastNode ? 'true' : 'false'}`,
  ];
  return (
    <div className='noDrag flex items-center justify-between gap-2 border-b border-zinc-100 px-3 py-2'>
      <div className='flex items-center gap-2'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={`flex h-5 w-5 shrink-0 cursor-help items-center justify-center rounded-full text-[10px] font-medium ${
                  state.isLastNode ? 'bg-amber-100 text-amber-700' : 'bg-zinc-200 text-zinc-600'
                }`}
                title={state.isLastNode ? '최종(건축 주제 선정) 노드' : `깊이 ${state.depth}`}
              >
                {state.isLastNode ? <Bookmark className='h-3 w-3' strokeWidth={2} /> : state.depth}
              </span>
            </TooltipTrigger>
            <TooltipContent side='bottom' align='start' className='max-w-xs'>
              <div className='space-y-1 text-[11px] leading-relaxed'>
                {debugLines.map((line) => (
                  <p key={line} className='font-mono'>
                    {line}
                  </p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className='flex flex-wrap gap-1'>
          {state.tags.map((t) => (
            <span
              key={t}
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium text-white ${
                t === '융합' || t === '연구합치기' ? 'bg-purple-500' : 'bg-blue-500'
              }`}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className='relative flex items-center gap-1' ref={menuRef}>
        <button
          type='button'
          onClick={actions.handlePinToggle}
          title={state.pinned ? '고정 해제' : '주제 고정'}
          className={`rounded p-0.5 transition-colors ${state.pinned ? 'text-indigo-600 hover:text-indigo-700' : 'text-zinc-400 hover:text-zinc-600'}`}
        >
          <Pin
            className='h-4 w-4'
            fill={state.pinned ? 'currentColor' : 'none'}
            strokeWidth={state.pinned ? 0 : 1.5}
          />
        </button>
        <button
          type='button'
          onClick={actions.handleCheckToggle}
          className='flex h-4 w-4 shrink-0 items-center justify-center rounded border border-zinc-300 hover:border-zinc-400'
        >
          {state.checked && <span className='text-xs text-indigo-600'>✓</span>}
        </button>
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            actions.setMenuOpen((o) => !o);
          }}
          className='rounded p-0.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
        >
          <MoreHorizontal className='h-4 w-4' />
        </button>
        {state.menuOpen && <TopicNodeMenu hasContent={state.hasContent} />}
      </div>
    </div>
  );
}

function TopicNodeMenu({ hasContent }: { hasContent: boolean }) {
  const { state, actions } = useTopicNodeContext();
  const openEnhance = useAsidebarStore((s) => s.openEnhance);

  return (
    <div className='noDrag absolute right-0 top-full z-50 mt-1 min-w-[100px] rounded-md border border-zinc-200 bg-white py-1 shadow-lg'>
      {hasContent && (
        <button
          type='button'
          onClick={() => {
            actions.setMenuOpen(false);
            window.dispatchEvent(
              new CustomEvent('nodeTopicSelect', { detail: { nodeId: state.id } })
            );
          }}
          className='w-full px-3 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50'
        >
          건축 주제선정
        </button>
      )}
      <button
        type='button'
        onClick={() => {
          actions.setMenuOpen(false);
          window.dispatchEvent(new CustomEvent('nodeRefresh', { detail: { id: state.id } }));
        }}
        className='w-full px-3 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50'
      >
        새로고침
      </button>
      <button
        type='button'
        onClick={() => {
          actions.setMenuOpen(false);
          openEnhance({ nodeId: state.id, nodeLabel: '' });
        }}
        className='w-full px-3 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50'
      >
        주제보강
      </button>
      <button
        type='button'
        onClick={() => {
          actions.setMenuOpen(false);
          window.dispatchEvent(new CustomEvent('nodeDelete', { detail: { id: state.id } }));
        }}
        className='w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50'
      >
        삭제
      </button>
    </div>
  );
}

function TopicNodeSubject({ subject }: { subject: string }) {
  return (
    <div className='border-b border-zinc-100 px-3 py-2'>
      <p className='font-topic line-clamp-1 text-left text-xs font-medium text-zinc-800'>
        {subject}
      </p>
    </div>
  );
}

// --- TopicNodeContent variants (explicit, no boolean modes) ---

function TopicNodeContentSelected({
  selectedContent,
  isProposalCreating = false,
  isProposalDraftReady = false,
}: {
  selectedContent: SelectedTopicContent;
  isProposalCreating?: boolean;
  isProposalDraftReady?: boolean;
}) {
  const { state } = useTopicNodeContext();

  const section = (label: string, text: string, _limit: number, limitLabel: string) => (
    <div className='border-b border-zinc-100 pb-2 last:border-0 last:pb-0'>
      <p className='mb-1 text-[10px] font-medium text-zinc-500'>
        {label} <span className='font-normal'>({limitLabel})</span>
      </p>
      <p className='whitespace-pre-wrap text-left text-xs leading-relaxed text-zinc-700'>
        {text || '—'}
      </p>
      {text && <p className='mt-0.5 text-[10px] text-zinc-400'>{text.length}자</p>}
    </div>
  );

  const handleGoToResearchPlan = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent('nodeGoToResearchPlan', {
        detail: { nodeId: state.id, mode: state.proposalMode },
      })
    );
  };

  return (
    <div className='noDrag flex flex-col'>
      <div className='topic-node-scroll min-h-[200px] max-h-[320px] overflow-y-auto px-3 py-2 space-y-3'>
        {section(
          '최종목표내용',
          selectedContent.finalObjective,
          SELECTED_TOPIC_LIMITS.finalObjective,
          '800자 이내'
        )}
        {section(
          '건축 기획내용',
          selectedContent.researchContent,
          SELECTED_TOPIC_LIMITS.researchContent,
          '800자'
        )}
        {selectedContent.expectedEffectAndPlan
          ? section(
              '건축 성과 활용계획 및 기대효과',
              selectedContent.expectedEffectAndPlan,
              SELECTED_TOPIC_LIMITS.expectedEffectAndPlan,
              '600자 이내'
            )
          : null}
      </div>
      <div className='flex gap-2 border-t border-zinc-100 px-3 py-2'>
        <div className='shrink-0'>
          <TopicNodeProposalModeDropdown disabled={isProposalCreating || isProposalDraftReady} />
        </div>
        <button
          type='button'
          onClick={handleGoToResearchPlan}
          disabled={isProposalCreating}
          className='flex min-w-0 flex-1 items-center justify-center rounded border-none bg-indigo-500 px-3 py-2 text-center text-xs font-medium text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-70'
        >
          {isProposalCreating ? (
            <span className='inline-flex items-center justify-center gap-1.5'>
              <Loader2 className='size-3.5 animate-spin' />
              초안 생성 중...
            </span>
          ) : isProposalDraftReady ? (
            <span className='flex w-full flex-col items-center leading-tight'>
              <span>건축 제안서 바로가기</span>
            </span>
          ) : (
            '건축 제안서 초안생성'
          )}
        </button>
      </div>
    </div>
  );
}

function TopicNodeProposalModeDropdown({ disabled = false }: { disabled?: boolean }) {
  const { state, actions } = useTopicNodeContext();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type='button'
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className='inline-flex max-w-full items-center justify-center gap-1 whitespace-nowrap rounded border border-zinc-300 bg-white px-2.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70'
        >
          <span>{PROPOSAL_MODE_LABEL[state.proposalMode]}</span>
          <ChevronDown className='size-3.5 shrink-0 text-zinc-500' />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='center' side='top' className='min-w-[132px]'>
        <DropdownMenuItem
          onClick={() => actions.setProposalMode('fast')}
          className='flex items-center justify-between gap-3 text-xs'
        >
          <span>빠른 모드</span>
          {state.proposalMode === 'fast' ? (
            <span className='text-[10px] text-indigo-600'>v3</span>
          ) : null}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => actions.setProposalMode('slow')}
          className='flex items-center justify-between gap-3 text-xs'
        >
          <span>느린 모드</span>
          {state.proposalMode === 'slow' ? (
            <span className='text-[10px] text-indigo-600'>v2</span>
          ) : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TopicNodeContentInput({
  content,
  placeholder,
  showExistingContent,
}: {
  content: string;
  placeholder?: string;
  showExistingContent?: boolean;
}) {
  const { state, actions, inputRef } = useTopicNodeContext();
  const isBusy = state.isTopicSelecting;

  const handleConcretize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (state.inputValue.trim()) actions.handleSubmit(e as unknown as React.FormEvent);
  };

  const handleAutoConcretize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('nodeAutoConcretize', { detail: { nodeId: state.id } }));
  };

  const handleTopicSelect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!state.canSelectTopic || isBusy) return;
    window.dispatchEvent(
      new CustomEvent('nodeTopicSelect', {
        detail: { nodeId: state.id, prompt: state.inputValue.trim() },
      })
    );
  };

  return (
    <div className='topic-node-scroll noDrag overflow-y-auto px-3 py-2 h-[140px]'>
      <div onClick={(e) => e.stopPropagation()} className='space-y-2'>
        {showExistingContent && content && (
          <p className='whitespace-pre-wrap text-left text-xs leading-relaxed text-zinc-600'>
            {content}
          </p>
        )}
        <input
          ref={inputRef}
          type='text'
          value={state.inputValue}
          onChange={(e) => actions.setInputValue(e.target.value)}
          placeholder={placeholder || '가설을 발전시킬 방향을 더해 보세요'}
          className='mb-2 w-full rounded border border-zinc-300 px-2.5 py-1.5 text-xs leading-relaxed text-zinc-700 outline-none'
        />
        <div className='flex justify-between gap-1.5'>
          <button
            type='button'
            onClick={handleConcretize}
            disabled={!state.inputValue.trim() || isBusy}
            title='프롬프트 또는 첨부 내용이 있을 때 활성화'
            className='flex-1 rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs font-medium text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-zinc-50'
          >
            주제구체화
          </button>
          <button
            type='button'
            onClick={handleAutoConcretize}
            disabled={isBusy}
            className='flex-1 rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50'
          >
            자동구체화
          </button>
          <button
            type='button'
            onClick={handleTopicSelect}
            disabled={!state.canSelectTopic || isBusy}
            title={
              state.canSelectTopic
                ? '현재 노드를 건축 주제로 선택합니다'
                : '백엔드에 저장된 노드만 선택할 수 있습니다'
            }
            className='flex-1 rounded border-none bg-indigo-500 px-2 py-1.5 text-xs font-medium text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {isBusy ? (
              <span className='inline-flex items-center gap-1'>
                <Loader2 className='size-3 animate-spin' />
                선정 중
              </span>
            ) : (
              '건축 주제선정'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * detail 메시지를 일정 간격으로 순환(rotate)시키는 훅.
 *
 * prompt_node는 detail을 순차적으로 "쌓는" 방식이지만,
 * topic_node는 3개가 병렬 실행되므로 "현재 작업 1개"만 보여주는 순환 방식이 적합.
 *
 * 동작:
 *   1. 현재 단계(stepIndex)의 detail 목록을 ROTATE_INTERVAL_MS 간격으로 순환
 *   2. detail을 한 바퀴 돌면 다음 stepIndex로 넘어감 (마지막 단계에서는 처음으로 되돌아가지 않음)
 *   3. isLoading이 false→true로 바뀌면 처음부터 재시작
 *
 * TODO: SSE 연결 시 서버에서 { stepLabel, detail } 이벤트가 올 때마다
 *       currentStepLabel / currentDetail 을 외부에서 주입하면 이 훅은 제거 가능
 */
const ROTATE_INTERVAL_MS = 1400; // detail 1개 표시 시간 (ms)

function useTopicLoadingCycle() {
  // 현재 표시 중인 단계 인덱스
  const [stepIndex, setStepIndex] = useState(0);
  // 현재 단계 안에서 표시 중인 detail 인덱스
  const [detailIndex, setDetailIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDetailIndex((prevDetail) => {
        const currentStep = TOPIC_NODE_LOADING_STEPS[stepIndex];
        const nextDetail = prevDetail + 1;

        if (nextDetail >= currentStep.details.length) {
          // 이 단계 detail을 모두 순환 → 다음 단계로
          const nextStep = stepIndex + 1;
          if (nextStep < TOPIC_NODE_LOADING_STEPS.length) {
            setStepIndex(nextStep);
          }
          // 마지막 단계면 마지막 detail에서 멈춤 (isLoading이 false로 바뀔 때까지 대기)
          return nextStep < TOPIC_NODE_LOADING_STEPS.length ? 0 : prevDetail;
        }

        return nextDetail;
      });
    }, ROTATE_INTERVAL_MS);

    return () => clearInterval(timer);
    // stepIndex가 바뀔 때마다 새 인터벌 등록
  }, [stepIndex]);

  const currentStep = TOPIC_NODE_LOADING_STEPS[stepIndex];
  return {
    stepLabel: currentStep.stepLabel,
    detail: currentStep.details[detailIndex],
  };
}

/**
 * TopicNodeContentLoading — topic_node 전용 2단 로딩 UI
 *
 * 레이아웃:
 *   ┌─────────────────────────────────┐
 *   │ [●] stepLabel (상위, 고정)       │  ← 단계 전환 시에만 교체
 *   │     detail 문장... (하위, 순환)  │  ← ROTATE_INTERVAL_MS 간격으로 교체
 *   └─────────────────────────────────┘
 *
 * 노드가 h-[140px] 고정이므로 기존 스켈레톤과 동일한 높이를 유지함.
 */
function TopicNodeContentLoading({
  streamStepLabel,
  streamDetails,
}: {
  streamStepLabel?: string;
  streamDetails?: string[];
}) {
  const { stepLabel, detail } = useTopicLoadingCycle();
  const latestDetail = streamDetails?.[streamDetails.length - 1];
  const currentStepLabel = streamStepLabel ?? stepLabel;
  const currentDetail = latestDetail ?? detail;

  return (
    <div className='topic-node-scroll noDrag overflow-y-auto px-3 py-2.5 h-[140px]'>
      {/* 상위: 현재 단계 제목 — 단계가 바뀔 때만 교체 */}
      <div className='mb-2.5 flex items-center gap-1.5'>
        <Spinner className='size-3 shrink-0 text-zinc-400' />
        <p className='text-[11px] font-medium leading-snug text-zinc-500'>{currentStepLabel}</p>
      </div>

      {/* 하위: 현재 detail 1개 — ROTATE_INTERVAL_MS마다 교체 */}
      <div className='flex items-start gap-2'>
        {/* 점멸 도트 — "처리 중" 시각화 */}
        <span className='mt-0.5 size-1.5 shrink-0 rounded-full bg-indigo-400 animate-pulse' />
        {/* key를 detail에 걸어두면 텍스트가 바뀔 때 fade-in 재실행 */}
        <p
          key={currentDetail}
          className='text-[11px] leading-relaxed text-zinc-400 animate-in fade-in duration-400'
        >
          {currentDetail}
        </p>
      </div>

      {streamDetails && streamDetails.length > 1 && (
        <div className='mt-3 space-y-1'>
          {streamDetails.slice(0, -1).map((item, index) => (
            <p key={`${item}-${index}`} className='text-[10px] leading-relaxed text-zinc-300'>
              {item}
            </p>
          ))}
        </div>
      )}

      {/* 하단 스켈레톤 바 — 빈 공간을 채워 높이 유지 */}
      <div className='mt-4 space-y-1.5'>
        <div className='h-2 w-3/4 animate-pulse rounded bg-zinc-100' />
        <div className='h-2 w-1/2 animate-pulse rounded bg-zinc-100' />
      </div>
    </div>
  );
}

function TopicNodeContentDisplay({ content }: { content: string }) {
  return (
    <div className='topic-node-scroll noDrag overflow-y-auto px-3 py-2 h-[140px]'>
      <p className='whitespace-pre-wrap text-left text-xs leading-relaxed text-zinc-700'>
        {content || '새 가설'}
      </p>
    </div>
  );
}

function TopicNodeContent(props: {
  isNew: boolean;
  isLoading: boolean;
  content: string;
  placeholder?: string;
  topicSelected?: boolean;
  selectedContent?: SelectedTopicContent;
  showInput?: boolean;
  streamStepLabel?: string;
  streamDetails?: string[];
}) {
  const {
    isNew,
    isLoading,
    content,
    placeholder,
    topicSelected,
    selectedContent,
    showInput,
    streamStepLabel,
    streamDetails,
  } = props;
  if (topicSelected && selectedContent)
    return <TopicNodeContentSelected selectedContent={selectedContent} />;
  if (isNew || showInput)
    return (
      <TopicNodeContentInput
        content={content}
        placeholder={placeholder}
        showExistingContent={!isNew && !!content}
      />
    );
  if (isLoading)
    return (
      <TopicNodeContentLoading streamStepLabel={streamStepLabel} streamDetails={streamDetails} />
    );
  return <TopicNodeContentDisplay content={content} />;
}

function TopicNodeKeywords({ keywords }: { keywords: string[] }) {
  if (keywords.length === 0) return null;
  const text = keywords.join(', ');
  return (
    <div className='noDrag min-w-0 border-t border-zinc-100 px-3 py-2'>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <p className='line-clamp-1 cursor-default text-left text-xs leading-snug text-primary'>
              {text}
            </p>
          </TooltipTrigger>
          <TooltipContent side='top' align='start' className='max-w-sm'>
            <p className='text-xs leading-relaxed wrap-break-word'>{text}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

function TopicNodeAddButton() {
  const { state } = useTopicNodeContext();
  const maxDepth = state.fromMerge ? 5 : 4;
  if (state.depth >= maxDepth || state.isLastNode) return null;
  return (
    <button
      type='button'
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('addNodeFromTopic', { detail: { nodeId: state.id } }));
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className='add-node-btn cursor-pointer absolute -right-3 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-300 bg-white text-sm font-bold text-zinc-600 shadow-md hover:bg-zinc-50'
    >
      +
    </button>
  );
}

function TopicNodeDetailButton() {
  const { state } = useTopicNodeContext();
  const openNodeDetail = useAsidebarStore((s) => s.openNodeDetail);
  return (
    <button
      type='button'
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openNodeDetail({
          nodeId: state.id,
          label: state.nodeDetailData.label,
          topicSelected: state.nodeDetailData.topicSelected,
          displayContent: state.nodeDetailData.displayContent,
          aiContent: state.nodeDetailData.aiContent,
          selectedContent: state.nodeDetailData.selectedContent,
        });
      }}
      className='noDrag flex flex-1 items-center justify-center gap-1.5 border-t border-zinc-100 px-3 py-2 text-xs text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-800'
    >
      <FileText className='size-3.5' />
      상세보기
    </button>
  );
}

function TopicNodePriorResearchButton() {
  const { state } = useTopicNodeContext();
  const openPriorResearch = useAsidebarStore((s) => s.openPriorResearch);
  const backendNodeId = state.backendNodeId;
  if (!backendNodeId) return null;
  return (
    <button
      type='button'
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openPriorResearch({ nodeId: state.id, backendTopicNodeId: backendNodeId });
      }}
      className='noDrag flex flex-1 items-center justify-center gap-1.5 border-t border-zinc-100 px-3 py-2 text-xs text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-800'
    >
      <FileSearch className='size-3.5' />
      유사 건축사례
    </button>
  );
}

function TopicNodeBottomActions() {
  return (
    <div className='noDrag flex w-full border-t border-zinc-100'>
      <TopicNodeDetailButton />
      <TopicNodePriorResearchButton />
    </div>
  );
}

function TopicNodeDepthControls() {
  const { state } = useTopicNodeContext();
  // Depth 1 전용: +·새로고침 버튼 (Depth 2~4에는 없음)
  if (!state.isLastInDepth || state.depth >= 2) return null;
  return (
    <div className='noDrag absolute left-1/2 top-full mt-5 z-20 flex -translate-x-1/2 items-center justify-center gap-1.5'>
      <button
        type='button'
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          window.dispatchEvent(
            new CustomEvent('depthAdd', { detail: { depth: state.depth, nodeId: state.id } })
          );
        }}
        className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-600 shadow-sm hover:bg-zinc-50 cursor-pointer'
        title='건축 주제 추가'
      >
        <Plus className='h-3.5 w-3.5' />
      </button>
      <button
        type='button'
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('depthRefresh', { detail: { depth: state.depth } }));
        }}
        className='flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-600 shadow-sm hover:bg-zinc-50 cursor-pointer'
        title='건축 주제 새로고침 (고정 제외)'
      >
        <RefreshCw className='h-3 w-3' />
        새로고침
      </button>
    </div>
  );
}

export const TopicNodeCompound = Object.assign(TopicNodeRoot, {
  Header: TopicNodeHeader,
  Subject: TopicNodeSubject,
  Content: TopicNodeContent,
  ContentSelected: TopicNodeContentSelected,
  ContentInput: TopicNodeContentInput,
  ContentLoading: TopicNodeContentLoading,
  ContentDisplay: TopicNodeContentDisplay,
  Keywords: TopicNodeKeywords,
  BottomActions: TopicNodeBottomActions,
  AddButton: TopicNodeAddButton,
  DepthControls: TopicNodeDepthControls,
});

// ============================================================================
// ReactFlow 노드 래퍼 (nodeTypes에 등록되는 컴포넌트)
// ============================================================================

export function TopicNode({
  id,
  data,
}: {
  id: string;
  data: Record<string, unknown>;
  selected?: boolean;
}) {
  // 서버가 준 depth는 그대로 유지한다.
  const rawLayoutDepth = data.depth as number | undefined;
  const depth = typeof rawLayoutDepth === 'number' && rawLayoutDepth > 0 ? rawLayoutDepth : 1;
  const tag = (data.tag as string) ?? '연구확장';
  const tags = (data.tags as string[] | undefined) ?? [tag];
  const content = data.content as TopicContent | undefined;
  const fullLabel = (data.label as string) ?? '';
  const checked = (data.checked as boolean) || false;
  const pinned = (data.pinned as boolean) || false;
  const isNew = (data.isNew as boolean) || false;
  const isLoading = (data.isLoading as boolean) || false;
  const fromMerge = (data.fromMerge as boolean) ?? false;
  const historyId = (data.historyId as string) ?? null;
  const topicSelected = (data.topicSelected as boolean) ?? false;
  const isLastNode = Boolean(data.isLastNode);
  const backendNodeId = ((data.backendNodeId as string | undefined) ?? '').trim() || null;
  const parentNodeId = ((data.parentNodeId as string | undefined) ?? '').trim() || null;
  const isTemporaryNode = (data.isTemporaryNode as boolean) ?? false;
  const canSelectTopic = Boolean(backendNodeId) || Boolean(parentNodeId) || !isTemporaryNode;
  const isTopicSelecting = (data.isTopicSelecting as boolean) ?? false;
  const isProposalCreating = (data.isProposalCreating as boolean) ?? false;
  const isProposalDraftReady = (data.isProposalDraftReady as boolean) ?? false;
  const rawSelected = data.selectedContent;
  const selectedContent = ((): SelectedTopicContent | undefined => {
    if (!rawSelected) return undefined;
    if (typeof rawSelected === 'object' && 'finalObjective' in rawSelected) {
      return rawSelected as SelectedTopicContent;
    }
    if (typeof rawSelected === 'string') {
      return { finalObjective: rawSelected, researchContent: '', expectedEffectAndPlan: '' };
    }
    return undefined;
  })();
  const showInput = (data.showInput as boolean) ?? false;
  const streamStepLabel = (data.streamStepLabel as string | undefined) ?? undefined;
  const streamDetails = (data.streamDetails as string[] | undefined) ?? undefined;

  const subjectLine = content?.subject ?? fullLabel;
  const compositeBody = content
    ? `${content.necessity}\n\n${content.methodology}\n\n${content.expectedEffect}`.trim()
    : '';
  const cardBodyContent = content ? content.overview?.trim() || compositeBody : fullLabel;
  const detailNodeText = content?.fullContent !== undefined ? content.fullContent : cardBodyContent;
  const displayKeywords = (content ? content.keywords : ((data.keywords as string[]) ?? [])).slice(
    0,
    5
  );

  const nodeDetailData: NodeDetailData = {
    label: subjectLine,
    topicSelected,
    displayContent:
      topicSelected && selectedContent
        ? [
            selectedContent.finalObjective,
            selectedContent.researchContent,
            selectedContent.expectedEffectAndPlan,
          ]
            .filter(Boolean)
            .join('\n\n')
        : detailNodeText,
    aiContent: (() => {
      const d = content?.detail?.trim();
      return d ? { detail: d } : undefined;
    })(),
    selectedContent: selectedContent
      ? {
          finalObjective: selectedContent.finalObjective,
          researchContent: selectedContent.researchContent,
          expectedEffectAndPlan: selectedContent.expectedEffectAndPlan,
        }
      : undefined,
  };

  return (
    <TopicNodeCompound
      id={id}
      depth={depth}
      tags={tags}
      checked={checked}
      pinned={pinned}
      isLoading={isLoading}
      isNew={isNew}
      fromMerge={fromMerge}
      hasContent={!!cardBodyContent}
      isLastNode={isLastNode}
      canSelectTopic={canSelectTopic}
      isTopicSelecting={isTopicSelecting}
      isProposalCreating={isProposalCreating}
      isProposalDraftReady={isProposalDraftReady}
      historyId={historyId}
      backendNodeId={backendNodeId}
      parentNodeId={parentNodeId}
      isTemporaryNode={isTemporaryNode}
      nodeDetailData={nodeDetailData}
      onCheckChange={(id, checked) =>
        window.dispatchEvent(new CustomEvent('nodeCheckChange', { detail: { id, checked } }))
      }
      onPinChange={(id, pinned) =>
        window.dispatchEvent(new CustomEvent('nodePinChange', { detail: { id, pinned } }))
      }
      onHypothesisSubmit={(id, prompt) =>
        window.dispatchEvent(new CustomEvent('nodeSubmitHypothesis', { detail: { id, prompt } }))
      }
    >
      <TopicNodeCompound.Header />
      {!isNew && !isLoading && subjectLine && !topicSelected && (
        <TopicNodeCompound.Subject subject={subjectLine} />
      )}
      {topicSelected && selectedContent ? (
        <TopicNodeCompound.ContentSelected
          selectedContent={selectedContent}
          isProposalCreating={isProposalCreating}
          isProposalDraftReady={isProposalDraftReady}
        />
      ) : isNew || showInput ? (
        <TopicNodeCompound.ContentInput
          content={cardBodyContent}
          placeholder='가설을 발전시킬 방향을 더해 보세요'
          showExistingContent={!isNew && !!cardBodyContent}
        />
      ) : isLoading ? (
        <TopicNodeCompound.ContentLoading
          streamStepLabel={streamStepLabel}
          streamDetails={streamDetails}
        />
      ) : (
        <TopicNodeCompound.ContentDisplay content={cardBodyContent} />
      )}
      {displayKeywords.length > 0 && !isNew && !isLoading && !topicSelected && (
        <TopicNodeCompound.Keywords keywords={displayKeywords} />
      )}
      <TopicNodeCompound.BottomActions />
      <TopicNodeCompound.AddButton />
      <TopicNodeCompound.DepthControls />
    </TopicNodeCompound>
  );
}
