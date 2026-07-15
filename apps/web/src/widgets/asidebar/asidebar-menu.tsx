'use client';

import {
  Folder,
  Bookmark,
  StickyNote,
  Eye,
  ListTodo,
  FileSearch,
  List,
  BarChart3,
  Layers,
  Tags,
  Play,
  FileText,
  FileBarChart,
  History,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';

import { MemoryPanel } from '@/features/memory';
import { FilePanel } from '@/features/project-files';
import {
  BookmarkPanel,
  ClippingsSortDropdown,
  DocumentDetailPanel,
  SummaryPanel,
  useRelatedWorksStore,
} from '@/features/related-works';
import {
  TopicChatSidebarContent,
  PriorResearchPanelContent,
  NodeDetailPanelContent,
} from '@/features/topic-selection';
import { cn } from '@/shared/lib/utils';
import { useAsidebarStore } from '@/shared/stores/asidebar-store';
import { Button } from '@/shared/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import { AsidebarFloatingPanel } from '@/widgets/asidebar';
import { ProposalMarkdownPreviewPanel } from '@/widgets/asidebar/proposal-markdown-preview-panel';
import { TodoPanel } from '@/widgets/todo';

const ASIDEBAR_COMING_SOON_TOAST = '구현 예정 이예요';

const MENU_ITEMS = [
  { icon: Folder, label: '파일' },
  { icon: Bookmark, label: '갈무리' },
  { icon: StickyNote, label: '메모리' },
  { icon: Eye, label: '미리보기' },
  { icon: ListTodo, label: '할일' },
] as const;

// 페이지별 동적 메뉴 (경로 slug -> { icon, label }[])
const PAGE_MENUS: Record<string, { icon: LucideIcon; label: string }[]> = {
  'topic-selection': [
    { icon: FileSearch, label: '상세보기' },
    { icon: FileText, label: '선행연구' },
  ],
  'research-analysis': [{ icon: List, label: '요약' }],
  'prior-research': [{ icon: FileSearch, label: '선행검색' }],
  'related-works': [],
  'research-plan': [{ icon: History, label: '버저닝' }],
  'diagram-table': [{ icon: Layers, label: '도식편집' }],
  differentiation: [{ icon: BarChart3, label: '강점분석' }],
  'tech-standard': [{ icon: Tags, label: '분류검색' }],
  'rb-evaluation': [],
  'submission-checklist': [],
  'execution-plan': [{ icon: Play, label: '실행' }],
};

const TOAST_ONLY_PAGE_LABELS = new Set([
  '요약',
  '버저닝',
  '도식편집',
  '강점분석',
  '분류검색',
  '실행',
]);

export function AsidebarMenu() {
  const pathname = usePathname();
  const pathParts = pathname.split('/').filter(Boolean);
  const pageSlug = pathParts[2] ?? '';
  const { selectedHistoryId } = useRelatedWorksStore();

  const basePageMenuItems = PAGE_MENUS[pageSlug] ?? [];
  const isRelatedWorksDetail = pageSlug === 'related-works' && selectedHistoryId != null;
  const pageMenuItems = isRelatedWorksDetail
    ? [...basePageMenuItems, { icon: FileBarChart, label: '전체 요약' }]
    : basePageMenuItems;

  const { panelType, openPanel, priorResearchContext } = useAsidebarStore();
  const setPreviewItem = useRelatedWorksStore((s) => s.setPreviewItem);

  const handleButtonClick = (label: string) => {
    if (
      label === '파일' ||
      label === '갈무리' ||
      label === '메모리' ||
      label === '미리보기' ||
      label === '할일'
    ) {
      openPanel(label);
    }
  };

  const handlePageMenuClick = (label: string) => {
    if (TOAST_ONLY_PAGE_LABELS.has(label)) {
      toast(ASIDEBAR_COMING_SOON_TOAST);
      return;
    }
    if (label === '문헌상세') {
      openPanel('문헌상세');
    } else if (label === '전체 요약') {
      openPanel('전체요약');
    } else if (label === '선행연구') {
      openPanel('선행연구');
    } else if (label === '상세보기') {
      openPanel('노드상세');
    }
  };

  const isPanelOpen =
    panelType === '파일' ||
    panelType === '갈무리' ||
    panelType === '메모리' ||
    panelType === '미리보기' ||
    panelType === '할일' ||
    panelType === '주제보강' ||
    panelType === '문헌상세' ||
    panelType === '전체요약' ||
    panelType === '선행연구' ||
    panelType === '노드상세';

  const panelTitle =
    panelType === '전체요약'
      ? '전체 요약'
      : panelType === '선행연구'
        ? '선행연구'
        : panelType === '노드상세'
          ? '상세보기'
          : (panelType ?? '');

  const documentDetailHeaderBack =
    panelType === '문헌상세' && priorResearchContext != null ? (
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='size-8 shrink-0 text-zinc-400 hover:bg-zinc-700 hover:text-white'
        aria-label='뒤로'
        onClick={() => {
          setPreviewItem(null);
          openPanel('선행연구');
        }}
      >
        <ArrowLeft className='size-4' />
      </Button>
    ) : null;

  return (
    <div className='relative flex h-full shrink-0'>
      {isPanelOpen && panelTitle && (
        <AsidebarFloatingPanel
          title={panelTitle}
          headerRight={
            panelType === '갈무리' ? (
              <ClippingsSortDropdown />
            ) : documentDetailHeaderBack ? (
              documentDetailHeaderBack
            ) : undefined
          }
        >
          {panelType === '파일' && <FilePanel />}
          {panelType === '갈무리' && <BookmarkPanel />}
          {panelType === '메모리' && <MemoryPanel />}
          {panelType === '미리보기' && <ProposalMarkdownPreviewPanel />}
          {panelType === '할일' && <TodoPanel />}
          {panelType === '주제보강' && <EnhancePanelContent />}
          {panelType === '문헌상세' && <DocumentDetailPanel />}
          {panelType === '전체요약' && <SummaryPanel />}
          {panelType === '선행연구' && <PriorResearchPanelContent />}
          {panelType === '노드상세' && <NodeDetailPanelContent />}
        </AsidebarFloatingPanel>
      )}

      <aside className='flex h-full w-[55px] flex-col items-center border-l border-zinc-700 bg-zinc-800 py-4'>
        <TooltipProvider delayDuration={0}>
          <div className='flex flex-1 flex-col items-center gap-4'>
            {MENU_ITEMS.map((item) => (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <button
                    type='button'
                    className='flex flex-col items-center gap-1'
                    onClick={() => handleButtonClick(item.label)}
                  >
                    <span
                      className={cn(
                        'flex size-9 items-center justify-center rounded-md transition-colors',
                        'text-zinc-400 hover:bg-zinc-700 hover:text-white',
                        panelType === item.label && 'bg-zinc-700 text-white'
                      )}
                    >
                      <item.icon className='size-5' />
                    </span>
                    <span className='pointer-events-none text-xs text-zinc-400'>{item.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side='left'>
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}

            {pageMenuItems.length > 0 && (
              <div className='flex w-full flex-col items-center gap-4 px-1'>
                <hr className='w-full border-zinc-600' />
                {pageMenuItems.map((item) => (
                  <Tooltip key={item.label}>
                    <TooltipTrigger asChild>
                      <button
                        type='button'
                        className='flex flex-col items-center gap-1'
                        onClick={() => handlePageMenuClick(item.label)}
                      >
                        <span
                          className={cn(
                            'flex size-9 items-center justify-center rounded-md transition-colors',
                            'text-zinc-400 hover:bg-zinc-700 hover:text-white',
                            panelType === '문헌상세' &&
                              item.label === '문헌상세' &&
                              'bg-zinc-700 text-white',
                            panelType === '전체요약' &&
                              item.label === '전체 요약' &&
                              'bg-zinc-700 text-white',
                            panelType === '선행연구' &&
                              item.label === '선행연구' &&
                              'bg-zinc-700 text-white',
                            panelType === '노드상세' &&
                              item.label === '상세보기' &&
                              'bg-zinc-700 text-white'
                          )}
                        >
                          <item.icon className='size-5' />
                        </span>
                        <span className='pointer-events-none text-center text-xs text-zinc-400'>
                          {item.label}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side='left'>
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            )}
          </div>
        </TooltipProvider>
      </aside>
    </div>
  );
}

function EnhancePanelContent() {
  const { enhanceContext, closePanel } = useAsidebarStore();

  const handleSend = (message: string) => {
    if (!enhanceContext) return;
    window.dispatchEvent(
      new CustomEvent('asidebarEnhanceSend', {
        detail: { nodeId: enhanceContext.nodeId, message },
      })
    );
    closePanel();
  };

  if (!enhanceContext) return null;

  return (
    <div className='flex h-full flex-col text-zinc-200'>
      <TopicChatSidebarContent
        selectedNodeLabel={enhanceContext.nodeLabel}
        onClose={closePanel}
        onSend={handleSend}
        variant='embedded'
      />
    </div>
  );
}
