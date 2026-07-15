'use client';

import {
  Bookmark,
  ExternalLink,
  Users,
  Building2,
  Calendar,
  Sparkles,
  FileText,
} from 'lucide-react';
import { createContext, use, useState } from 'react';

import { useRelatedWorksStore } from '@/features/related-works/model/related-works-store';
import type { SearchResult } from '@/features/related-works/model/types';
import { DocumentTypeTag } from '@/features/related-works/ui/document-type-tag';
import { cn } from '@/shared/lib/utils';
import { useAsidebarStore } from '@/shared/stores/asidebar-store';
import { Button } from '@/shared/ui/button';
import { StateTag } from '@/shared/ui/state-tag';

interface ResultCardState {
  result: SearchResult;
  isBookmarked: boolean;
  isSelected: boolean;
}

interface ResultCardActions {
  onBookmark?: () => void;
}

type ResultCardVariant = 'default' | 'dark';

interface ResultCardContextValue {
  state: ResultCardState;
  actions: ResultCardActions;
  variant: ResultCardVariant;
}

const ResultCardContext = createContext<ResultCardContextValue | null>(null);

function useResultCard() {
  const context = use(ResultCardContext);
  if (!context) throw new Error('ResultCard components must be used within ResultCard.Root');
  return context;
}

interface ResultCardRootProps {
  result: SearchResult;
  isBookmarked?: boolean;
  isSelected?: boolean;
  onBookmark?: () => void;
  /** 어두운 플로팅 패널(선행연구 사이드바 등)용 */
  variant?: ResultCardVariant;
  children: React.ReactNode;
}

function ResultCardRoot({
  result,
  isBookmarked = false,
  isSelected = false,
  onBookmark,
  variant = 'default',
  children,
}: ResultCardRootProps) {
  const value: ResultCardContextValue = {
    state: { result, isBookmarked, isSelected },
    actions: { onBookmark },
    variant,
  };
  const isDark = variant === 'dark';
  return (
    <ResultCardContext.Provider value={value}>
      <div
        className={cn(
          'group relative rounded-xs border p-4 shadow-sm transition-all',
          isDark
            ? cn(
                'border-zinc-600/90 bg-zinc-900/90 hover:border-zinc-500',
                isSelected && 'border-indigo-400 ring-2 ring-indigo-500/40'
              )
            : cn(
                'bg-white',
                isSelected
                  ? 'border-indigo-400 ring-2 ring-indigo-200'
                  : 'border-zinc-200 hover:border-zinc-300'
              )
        )}
      >
        {children}
      </div>
    </ResultCardContext.Provider>
  );
}

interface ResultCardHeaderProps {
  showCheckbox?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

function ResultCardHeader({ showCheckbox, checked, onCheckedChange }: ResultCardHeaderProps) {
  const { state, actions, variant } = useResultCard();
  const isDark = variant === 'dark';
  return (
    <div className='mb-3 flex items-start gap-3'>
      {showCheckbox && (
        <input
          type='checkbox'
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className={cn(
            'mt-1 size-4 cursor-pointer rounded text-indigo-600',
            isDark ? 'border-zinc-500 bg-zinc-800' : 'border-zinc-300'
          )}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <div className='flex flex-1 items-center gap-2'>
        <DocumentTypeTag
          type={state.result.type}
          className={
            isDark
              ? 'border-emerald-800/80 bg-emerald-950/60 text-emerald-200'
              : undefined
          }
        />
        <StateTag
          variant='red'
          bordered
          className={cn(
            'gap-1',
            isDark && 'border-rose-800/90 bg-rose-950/55 text-rose-100'
          )}
        >
          <Sparkles className='mr-1 size-3' />
          {state.result.similarity}%
        </StateTag>
      </div>
      {actions.onBookmark && (
        <Button
          variant='ghost'
          size='sm'
          onClick={(e) => {
            e.stopPropagation();
            actions.onBookmark!();
          }}
          className={cn(
            'size-8 p-0 transition-colors',
            state.isBookmarked
              ? 'text-amber-400 hover:text-amber-300'
              : isDark
                ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-700'
          )}
        >
          <Bookmark className={cn('size-4', state.isBookmarked && 'fill-current')} />
        </Button>
      )}
    </div>
  );
}

function ResultCardBody() {
  const { state, variant } = useResultCard();
  const { result } = state;
  const isDark = variant === 'dark';
  const [isExpanded, setIsExpanded] = useState(false);
  const date = new Date(result.publishedAt);
  const formattedDate = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className='space-y-3'>
      <h3
        className={cn(
          'line-clamp-2 text-lg font-semibold leading-snug',
          isDark
            ? 'font-gowun-batang-bold text-zinc-100'
            : 'font-gowun-batang-bold text-xl text-zinc-800'
        )}
      >
        {result.title}
      </h3>
      <div
        className={cn(
          'flex flex-wrap items-center gap-3 text-sm',
          isDark ? 'text-zinc-400' : 'text-zinc-600'
        )}
      >
        {result.authors.length > 0 && (
          <div className='flex items-center gap-1.5'>
            <Users className='size-4 shrink-0' />
            <span className='line-clamp-1'>{result.authors.join(', ')}</span>
          </div>
        )}
        {result.organization && (
          <>
            <span className={isDark ? 'text-zinc-600' : 'text-zinc-400'}>·</span>
            <div className='flex items-center gap-1.5'>
              <Building2 className='size-4 shrink-0' />
              <span className='line-clamp-1'>{result.organization}</span>
            </div>
          </>
        )}
        <span className={isDark ? 'text-zinc-600' : 'text-zinc-400'}>·</span>
        <div className='flex items-center gap-1.5'>
          <Calendar className='size-4 shrink-0' />
          <span>{formattedDate}</span>
        </div>
      </div>
      {result.doi && result.doiUrl && (
        <div
          className={cn(
            'flex items-start gap-2 text-sm',
            isDark ? 'text-zinc-300' : 'text-zinc-600'
          )}
        >
          <span
            className={cn(
              'shrink-0 rounded-xs border px-1.5 py-0.5 text-[11px] font-medium',
              isDark
                ? 'border-zinc-700 bg-zinc-800 text-zinc-200'
                : 'border-zinc-200 bg-zinc-50 text-zinc-700'
            )}
          >
            DOI
          </span>
          <a
            href={result.doiUrl}
            target='_blank'
            rel='noopener noreferrer'
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'min-w-0 truncate underline-offset-2 hover:underline',
              isDark ? 'text-zinc-200 hover:text-white' : 'text-zinc-700 hover:text-zinc-900'
            )}
            title={result.doi}
          >
            {result.doi}
          </a>
        </div>
      )}
      <div
        className={cn(
          'text-sm leading-relaxed',
          isDark ? 'text-zinc-300' : 'text-zinc-600'
        )}
      >
        <p className={cn(!isExpanded && 'line-clamp-3')}>{result.abstract}</p>
        {result.abstract.length > 150 && (
          <button
            type='button'
            onClick={() => setIsExpanded(!isExpanded)}
            className={
              isDark
                ? 'mt-1 text-zinc-400 hover:text-zinc-200'
                : 'mt-1 text-zinc-500 hover:text-zinc-700'
            }
          >
            {isExpanded ? '접기' : '더보기'}
          </button>
        )}
      </div>
    </div>
  );
}

function ResultCardFooter() {
  const { state, variant } = useResultCard();
  const { result } = state;
  const isDark = variant === 'dark';
  const handleDetailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    useRelatedWorksStore.setState({ previewItem: result });
    useAsidebarStore.getState().openPanel('문헌상세');
  };

  return (
    <div className='mt-4'>
      {result.keywords.length > 0 && (
        <div className='mb-3 flex flex-wrap gap-2'>
          {result.keywords.slice(0, 5).map((keyword) => (
            <StateTag
              key={keyword}
              variant='blue'
              className={cn(
                'font-normal',
                isDark &&
                  'border-sky-900/80 bg-sky-950/50 text-sky-100'
              )}
            >
              {keyword}
            </StateTag>
          ))}
        </div>
      )}
      <div
        className={cn(
          'flex items-center gap-2 border-t pt-3',
          isDark ? 'border-zinc-600/80' : 'border-zinc-200'
        )}
      >
        <Button
          variant='ghost'
          size='sm'
          onClick={handleDetailClick}
          className={
            isDark
              ? 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50'
              : 'text-zinc-600 hover:text-zinc-800'
          }
        >
          <FileText className='mr-1.5 size-4' />
          상세보기
        </Button>
        {result.url && (
          <Button
            variant='ghost'
            size='sm'
            asChild
            className={
              isDark
                ? 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50'
                : 'text-zinc-600 hover:text-zinc-800'
            }
          >
            <a
              href={result.url}
              target='_blank'
              rel='noopener noreferrer'
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className='mr-1.5 size-4' />
              원문 보기
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

export const ResultCard = Object.assign(ResultCardRoot, {
  Header: ResultCardHeader,
  Body: ResultCardBody,
  Footer: ResultCardFooter,
});
