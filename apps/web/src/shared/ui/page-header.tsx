'use client';

import { HelpCircle } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** 타이틀 위에 배치 (예: 뒤로 가기 버튼) */
  leading?: React.ReactNode;
  /** 우측 액션 영역 (예: 버튼) */
  action?: React.ReactNode;
  /** 타이틀 옆 ? 아이콘 표시 시 툴팁 내용 */
  titleTooltip?: string;
  className?: string;
}

/** 본문 `p-6` 안에서 상단 `PageHeader`를 가로로 맞닿게 쓸 때 (선행연구 상세 등) */
export function PageHeaderBleed({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('sticky top-0 z-40 -mx-6 mb-6 bg-white', className)}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  leading,
  action,
  titleTooltip,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('sticky top-0 z-40 border-b border-zinc-200 bg-white p-6', className)}>
      {leading && <div className='mb-3'>{leading}</div>}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='flex items-center gap-2 text-2xl font-semibold text-zinc-800'>
            {title}
            {titleTooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type='button'
                      className='inline-flex shrink-0 rounded-full p-0.5 text-zinc-400 transition hover:text-zinc-600'
                      aria-label='사용설명'
                    >
                      <HelpCircle className='size-4' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='bottom' className='max-w-xs whitespace-pre-line'>
                    {titleTooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </h1>
          {description && <p className='mt-1 text-sm text-zinc-600'>{description}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
