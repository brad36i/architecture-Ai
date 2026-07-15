'use client';

import * as React from 'react';

import { cn } from '@/shared/lib/utils';
import { StateTag } from '@/shared/ui/state-tag';
import { TabsList, TabsTrigger } from '@/shared/ui/tabs';

export interface UnderlineTabItem {
  value: string;
  label: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
  triggerId?: string;
}

interface UnderlineTabListProps {
  items: UnderlineTabItem[];
  tone?: 'light' | 'dark';
  fullWidth?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function UnderlineTabList({
  items,
  tone = 'light',
  fullWidth = false,
  className,
  triggerClassName,
}: UnderlineTabListProps) {
  const isDark = tone === 'dark';

  return (
    <TabsList
      variant='line'
      className={cn(
        'h-auto w-full flex-wrap justify-start gap-0 border-0 bg-transparent p-0',
        isDark ? 'border-b border-zinc-700' : 'border-b border-zinc-200',
        className
      )}
    >
      {items.map((item) => (
        <TabsTrigger
          key={item.value}
          id={item.triggerId}
          value={item.value}
          disabled={item.disabled}
          className={cn(
            'group flex items-center gap-1.5 border-0 bg-transparent px-2 py-1.5 text-base data-[state=active]:bg-transparent',
            isDark
              ? 'text-white hover:text-white data-[state=active]:text-white data-[state=active]:font-semibold'
              : 'text-zinc-500 hover:text-zinc-900 data-[state=active]:text-zinc-900 data-[state=active]:font-semibold',
            fullWidth && 'flex-1',
            triggerClassName
          )}
        >
          <span>{item.label}</span>
          {item.badge ? (
            <StateTag
              variant='darkgray'
              className={cn(
                'px-1 py-0 text-[10px]',
                isDark
                  ? 'border border-white/25 bg-white/15 text-white group-data-[state=active]:border-white/40 group-data-[state=active]:bg-white/25'
                  : 'border border-zinc-200 bg-zinc-100 text-zinc-600 group-data-[state=active]:border-zinc-300 group-data-[state=active]:bg-zinc-200 group-data-[state=active]:text-zinc-800'
              )}
            >
              {item.badge}
            </StateTag>
          ) : null}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
