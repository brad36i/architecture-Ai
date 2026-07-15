'use client';

import React from 'react';

import { cn } from '@/shared/lib/utils';
import type { RndNoticeCardData } from '../model/types';
import { RndCardContent } from './rnd-card-content';

/** `.old` NoticeCard 루트(article) + `RndCardContent` */
export function RndNoticeCard({
  data,
  className,
  onCardClick,
  onCreateProject,
}: {
  data: RndNoticeCardData;
  className?: string;
  onCardClick?: (data: RndNoticeCardData) => void;
  onCreateProject?: (ezrndNoticeId: string) => void;
}) {
  return (
    <article
      className={cn(
        'relative flex w-full flex-col rounded-xs border border-zinc-200 bg-white p-2.5 text-zinc-900 shadow-sm transition-all duration-200',
        'hover:border-sky-300',
        onCardClick && 'cursor-pointer',
        className
      )}
      onClick={onCardClick ? () => onCardClick(data) : undefined}
    >
      <RndCardContent data={data} onCreateProject={onCreateProject} />
    </article>
  );
}
