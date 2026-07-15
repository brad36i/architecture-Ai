'use client';

import { CalendarIcon, Trash2, FileText, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

import type { SearchHistory } from '@/features/related-works/model/types';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { StateTag } from '@/shared/ui/state-tag';

interface HistoryListProps {
  histories: SearchHistory[];
  selectedId: string | null;
  projectId: string;
  getNodeIdByHistoryId?: (historyId: string) => string | null;
  isNodeDeleted?: (nodeId: string) => boolean;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
  onNewSearchClick?: () => void;
}

export function HistoryList({
  histories,
  selectedId,
  projectId,
  getNodeIdByHistoryId,
  isNodeDeleted,
  onSelect,
  onDelete,
  onNewSearchClick,
}: HistoryListProps) {
  if (histories.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <FileText className='mb-4 size-16 text-zinc-400' />
        <h3 className='mb-2 text-lg font-semibold text-zinc-700'>검색 히스토리가 없습니다</h3>
        <p className='mb-6 text-sm text-zinc-600'>
          주제선택 페이지에서 주제를 확정하거나,
          <br />새 검색을 시작하세요.
        </p>
        <Button variant='default' onClick={onNewSearchClick}>
          새 선행연구 검색 시작
        </Button>
      </div>
    );
  }

  return (
    <div className='grid gap-4'>
      {histories.map((history) => (
        <HistoryCard
          key={history.id}
          history={history}
          isSelected={history.id === selectedId}
          projectId={projectId}
          topicNodeId={getNodeIdByHistoryId?.(history.id) ?? null}
          isNodeDeleted={isNodeDeleted ? (nodeId) => isNodeDeleted(nodeId) : undefined}
          onSelect={() => onSelect(history.id)}
          onDelete={onDelete ? () => onDelete(history.id) : undefined}
        />
      ))}
    </div>
  );
}

interface HistoryCardProps {
  history: SearchHistory;
  isSelected: boolean;
  projectId: string;
  topicNodeId: string | null;
  isNodeDeleted?: (nodeId: string) => boolean;
  onSelect: () => void;
  onDelete?: () => void;
}

function HistoryCard({
  history,
  isSelected,
  projectId,
  topicNodeId,
  isNodeDeleted,
  onSelect,
  onDelete,
}: HistoryCardProps) {
  const router = useRouter();
  const date = new Date(history.createdAt);
  const formattedDate = date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const isDeleted = topicNodeId ? isNodeDeleted?.(topicNodeId) : history.topicDeleted;
  const totalCount =
    history.totalCount ??
    history.resultCounts.report +
      history.resultCounts.paper +
      history.resultCounts.patent +
      history.resultCounts.article +
      (history.resultCounts.blog ?? 0);

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'group relative w-full cursor-pointer rounded-xs border bg-white p-4 text-left shadow-sm transition-all',
        isSelected
          ? 'border-indigo-400 ring-2 ring-indigo-200'
          : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
      )}
    >
      <div className='mb-3 flex items-start justify-between gap-2'>
        <div className='flex-1 space-y-2'>
          <div className='flex flex-wrap items-center justify-start gap-2'>
            <StateTag
              variant={history.source === 'auto' ? 'green' : 'blue'}
              bordered
              className='text-xs'
            >
              {history.source === 'auto' ? '자동' : '수동'}
            </StateTag>
            {topicNodeId ? (
              isDeleted ? (
                <StateTag variant='darkgray' className='text-xs'>
                  토픽 삭제됨
                </StateTag>
              ) : (
                // TODO: 나중에 확인하고 삭제
                <StateTag
                  variant='yellow'
                  bordered
                  className='cursor-pointer gap-1 text-xs'
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/projects/${projectId}/topic-selection?focusNode=${topicNodeId}`);
                  }}
                >
                  <MapPin className='size-3' />
                  주제 선정
                </StateTag>
              )
            ) : isDeleted ? (
              <StateTag variant='darkgray' className='text-xs'>
                토픽 삭제됨
              </StateTag>
            ) : null}
          </div>
          <h3 className='font-gowun-batang-bold text-xl font-semibold text-zinc-800 line-clamp-1'>
            {history.keyword}
          </h3>
          <div className='flex flex-wrap items-center gap-2 text-xs text-zinc-600'>
            <CalendarIcon className='size-3' />
            <span>{formattedDate}</span>
          </div>
        </div>
        <div className='flex gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
          {onDelete && (
            <Button
              variant='ghost'
              size='sm'
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className='size-8 p-0 text-zinc-500 hover:text-red-600'
            >
              <Trash2 className='size-4' />
            </Button>
          )}
        </div>
      </div>
      <div className='flex flex-wrap gap-3 text-sm'>
        <span className='text-zinc-600'>
          전체 <span className='font-semibold text-zinc-700'>{totalCount}건</span>
        </span>
        <span className='text-zinc-400'>·</span>
        <span className='text-zinc-600'>
          건축사례{' '}
          <span className='font-semibold text-zinc-700'>{history.resultCounts.report}</span>
        </span>
        <span className='text-zinc-400'>·</span>
        <span className='text-zinc-600'>
          논문 <span className='font-semibold text-zinc-700'>{history.resultCounts.paper}</span>
        </span>
        <span className='text-zinc-400'>·</span>
        <span className='text-zinc-600'>
          특허 <span className='font-semibold text-zinc-700'>{history.resultCounts.patent}</span>
        </span>
        <span className='text-zinc-400'>·</span>
        <span className='text-zinc-600'>
          기사·블로그{' '}
          <span className='font-semibold text-zinc-700'>
            {history.resultCounts.article + (history.resultCounts.blog ?? 0)}
          </span>
        </span>
      </div>
    </div>
  );
}
